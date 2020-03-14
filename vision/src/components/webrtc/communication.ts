import { Subject, Subscription, of } from "rxjs";
import { map, flatMap, catchError } from "rxjs/operators";

import {
	WsMessage,
	makeChatMessage,
	CHAT_MESSAGE_ADD,
	WsCommand,
	WsCommandTypes
} from "../../state/message-types";
import {
	createLoginAction,
	websocketAction,
	chatMessageAction
} from "../../state/action-creators";
import { USER_CONNECTION_EVT } from "../../state/types";

const logger = console;
const log = logger.log;

export interface WSSetup {
	auth: any,
	loginAction: typeof createLoginAction,
	chatAction: typeof chatMessageAction,
}

export interface ConnectionEvent {
	connected_users: string[]
}

type Hdlr = (msg: WsMessage<any>) => void;

interface SockSubj {
	sock$: Subject<string>;
	subscription: Subscription
}

export class WebComm {
	user: string;
	targets$: Subject<string>;
	socket: WebSocket;
	send$: Subject<string>;
	peer: RTCPeerConnection | null;  // FIXME: make this a map of RTCPeers
	sockHdlrIdx: number | null;
	#commHandlers: Map<string, Hdlr>;
	videoRef: React.RefObject<HTMLVideoElement> | null;

	constructor(user: string) {
		this.user = user;
		this.targets$ = new Subject();
		this.socket = this.createSocket();
		this.send$ = new Subject();
		this.peer = null;
		this.sockHdlrIdx = null;
		this.#commHandlers = new Map();
		this.videoRef = null;

		this.setupCmdHandlers();
	}

	createSocket = () => {
		const origin = window.location.host;
		// FIXME:  Add JWT token
		const url = `wss://${origin}/chat/${this.user}`;
		logger.log(`Connecting to ${url}`);
		return new WebSocket(url);
	}

	/**
	 * Creates a Subject that takes strings that are pre-subscribed to be sent by socket
	 * 
	 * Instead of handing out references to the socket, we hand this out instead and user can do this:
	 * 
	 * ```typescript
	 * let { sock$, subscription } = webcomm.makeSocketStream();
	 * sock$.next("hello world");
	 * subscription.unsubscribe();
	 * ```
	 */
	makeSocketStream = () => {
		const socket = this.socket;
		if (!socket) {
			return null;
		}

		let sock$: Subject<string> = new Subject();
		let subscription = sock$.subscribe(msg => socket.send(msg));
		return { sock$, subscription };
	}

	/**
	 * Handles a Ping type of WsCommand, used as a keep alive mechanism
	 *
	 * @param socket
	 */
	initPingRequestHandler = (msg: WsMessage<any>) => {
		const cmd = msg.body as WsCommand<any>;
		const args = cmd.args as string[];
		const replyMsg: WsMessage<string> = {
			sender: msg.sender,
			recipients: msg.recipients,
			event_type: "CommandReply",
			time: Date.now(),
			body: JSON.stringify({
				cmd: {
					op: "pong",
					ack: false,
					id: this.user
				},
				args
			})
		};
		this.socket.send(JSON.stringify(replyMsg));
		logger.debug(`Sent reply: `, replyMsg);
	}

	sdpOfferHandler = (msg: WsMessage<WsCommand<string>>) => {
		const cmd = msg.body as WsCommand<string>;
		
		logger.log("Got SDPOffer from ", msg.sender);
	}

	/**
	 * Handles Websocket intialization when the user selects Menu -> Chat
	 */
	socketSetup = (props: WSSetup) => {
		this.socket.onmessage = (evt: MessageEvent) => {
			const msg: WsMessage<any> = JSON.parse(evt.data);
			const auth = props.auth;
	
			logger.debug(`Got message: `, msg);
	
			switch (msg.event_type) {
				case "Disconnect":
				case "Connect":
					logger.log("Got websocket event", msg);
					const { connected_users } = msg.body as ConnectionEvent;
					props.loginAction(connected_users, "", auth, USER_CONNECTION_EVT);
					break;
				case "Data":
					logger.log("Got websocket event", msg);
					break;
				case "Message":
					logger.log("Got websocket event", msg);
					props.chatAction(makeChatMessage(msg), CHAT_MESSAGE_ADD);
					break;
				case "CommandRequest":
					// Pass it to the commandHandler
					this.commandHandler(msg);
					logger.info("Delegating to ")
					break;
				default:
					logger.log("Unknown message type", msg.event_type);
			}
		}
	}

	/**
	 * Dynamically adds handlers for commands
	 */
	addCmdHdlr = (action: string, handler: Hdlr) => {
		this.#commHandlers.set(action, handler);
	}

	commandHandler = (msg: WsMessage<any>) => {
		const cmd = msg.body as WsCommand<any>;
		logger.debug(`command is =`, cmd);

		const hdlr = this.#commHandlers.get(cmd.cmd.op);
		if (!hdlr) {
			logger.warn(`No handlder for ${cmd.cmd.op}.  No action taken`);
			return;
		}
	}

	/**
	 * Sets up our initial commandHandlers
	 * 
	 * Later, we can dynamically add handlers
	 */
	setupCmdHandlers = () => {
		this.addCmdHdlr("Ping", this.initPingRequestHandler);
		this.addCmdHdlr("SDPOffer", this.sdpOfferHandler)
	}

	/**
	 * Handles setting up RTCPeerConnection
	 */
	rtcSetup = () => {
		const peer = new RTCPeerConnection({
			iceServers: [
				{
					urls: [
						"stun.l.google.com:19305",
						"stun1.l.google.com:19305",
						"stun2.l.google.com:19305",
						"stun3.l.google.com:19305",
						"stun4.l.google.com:19305",
					]
				}
			]
		});

		if (!peer) {
			throw new Error("Unable to create RTCPeerConnection");
		}

		peer.onnegotiationneeded = this.handleNegotiationNeededEvent;
		peer.onicecandidate = this.handleICECandidateEvent;
		peer.oniceconnectionstatechange = this.handleICEConnectionStateChangeEvent;
		peer.onicegatheringstatechange = this.handleICEGatheringStateChangeEvent;
		peer.onsignalingstatechange = this.handleSignalingStateChangeEvent

		return peer;
	}

	handleICECandidateEvent = (event: RTCPeerConnectionIceEvent) => {
		if (event.candidate) {
			logger.log("*** Outgoing ICE candidate: " + event.candidate.candidate);

			this.targets$.subscribe({
				next: (receiver) => {
					const mesg = makeWsICECandMsg(this.user, receiver, {
						type: "new-ice-candidate",
						candidate: JSON.stringify(event.candidate)
					});

					this.socket.send(JSON.stringify(mesg));
				},
				error: (err) => logger.error(err),
				complete: () => logger.log("User subject has completed")
			});
		} else {
			logger.warn("no candidate in event");
		}
	};

	handleNegotiationNeededEvent = (evt: Event) => {
		const { peer, socket } = this;
		if (!peer) {
			logger.error("RTCPeerConnection not setup yet");
			return;
		}

		logger.log("*** Negotiation needed");
		const handle$ = this.targets$.pipe(
			flatMap((receiver) => {
				return peer.createOffer().then(offer => {
					return {
						receiver,
						offer
					};
				});
			}),
			map((state) => {
				const { offer, receiver } = state;
				if (peer.signalingState !== "stable") {
					logger.log("     -- The connection isn't stable yet; postponing...");
					return of(state);
				}

				// Establish the offer as the local peer's current
				// description.
				logger.log("---> Setting local description to the offer");
				return peer.setLocalDescription(offer).then(_ => {
					return state;
				});
			}),
			flatMap(state => state),
			map((state) => {
				const { offer, receiver } = state;
				// Send the offer to the remote peer.
				logger.log("---> Sending the offer to the remote peer");
				const msg = makeWsSDPMessage(this.user, receiver, new RTCSessionDescription({
					type: "offer",
					sdp: JSON.stringify(peer.localDescription)
				}));
				socket.send(JSON.stringify(msg));
				return true;
			}),
			catchError((err) => {
				logger.error("Error occurred while handling the negotiationneeded event:", err);
				return of(false);
			})
		)
	}

	handleICEConnectionStateChangeEvent = (event: Event) => {
		const { peer } = this;
		if (!peer) {
			logger.error("RTCPeerConnection not created yet");
			return
		}
		logger.log("*** ICE connection state changed to " + peer.iceConnectionState);

		switch (peer.iceConnectionState) {
			case "closed":
			case "failed":
			case "disconnected":
				this.closeVideoCall();
				break;
		}
	}

	handleICEGatheringStateChangeEvent = (event: Event) => {
		if (!this.peer) {
			logger.error("No RTCPeerConnection yet");
			return;
		}
		logger.log("*** ICE gathering state changed to: " + this.peer.iceGatheringState);
	};

		/**
	 * Set up a |signalingstatechange| event handler. This will detect when
	 * the signaling connection is closed
	 *
	 * NOTE: This will actually move to the new RTCPeerConnectionState enum
	 * returned in the property RTCPeerConnection.connectionState when
	 * browsers catch up with the latest version of the specification!
	 * @param event
	 */
	handleSignalingStateChangeEvent = (event: Event) => {
		if (!this.peer) {
			logger.error("No RTCPeerConnection yet");
			return;
		}

		logger.log("*** WebRTC signaling state changed to: " + this.peer.signalingState);
		switch (this.peer.signalingState) {
			case "closed":
				this.closeVideoCall();
				break;
		}
	};

		/**
	 * Called by the WebRTC layer when events occur on the media tracks
	 * on our WebRTC call. This includes when streams are added to and
	 * removed from the call.
	 *
	 * track events include the following fields
	 *
	 * RTCRtpReceiver       receiver
	 * MediaStreamTrack     track
	 * MediaStream[]        streams
	 * RTCRtpTransceiver    transceiver
	 *
	 * In our case, we're just taking the first stream found and attaching
	 * it to the <video> element for incoming media.
	 */
	handleTrackEvent = (event: RTCTrackEvent) => {
		logger.log("*** Track event");
		if (this.videoRef && this.videoRef.current) {
			this.videoRef.current.srcObject = event.streams[0];
		}
	}

	closeVideoCall = () => {
		const localVideo = document.getElementById("local_video") as HTMLVideoElement;
		logger.log("Closing the call");
	
		// Close the RTCPeerConnection
		if (!this.peer) {
			logger.error("RTCPeerConnection was null");
			return;
		}
		logger.log("--> Closing the peer connection");
	
		// Disconnect all our event listeners; we don't want stray events
		// to interfere with the hangup while it's ongoing.
		this.peer.ontrack = null;
		this.peer.onicecandidate = null;
		this.peer.oniceconnectionstatechange = null;
		this.peer.onsignalingstatechange = null;
		this.peer.onicegatheringstatechange = null;
		this.peer.onnegotiationneeded = null;
	
		// Stop all transceivers on the connection
		this.peer.getTransceivers().forEach(transceiver => {
			transceiver.stop();
		});
	
		// Stop the webcam preview as well by pausing the <video>
		// element, then stopping each of the getUserMedia() tracks
		// on it.
		if (localVideo && localVideo.srcObject) {
			localVideo.pause();
			const stream = localVideo.srcObject as MediaStream;
			stream.getTracks().forEach(track => {
				track.stop();
			});
		}
	
		// Close the peer connection
		this.peer.close();
		this.peer = null;
	};
}

export interface ICECandidateMessage {
	type: "new-ice-candidate",
	candidate: string // sdp candidate string describing offered protocol
}

export const makeWsICECandMsg = (sender: string, reciever: string, cand: ICECandidateMessage) => {
	const msg: WsMessage<WsCommand<ICECandidateMessage>> = {
		sender,
		recipients: [reciever],
		time: Date.now(),
		body: {
			cmd: {
				op: "IceCandidate",
				id: "",
				ack: true
			},
			args: cand
		},
		event_type: "CommandRequest"
	};
	return msg;
};

export const makeWsSDPMessage = (sender: string, receiver: string, sdp: RTCSessionDescription) => {
	const msg: WsMessage<WsCommand<RTCSessionDescription>> = {
		sender,
		recipients: [receiver],
		event_type: "CommandRequest",
		body: {
			cmd: {
				op: "SDPOffer",
				id: "",
				ack: true
			},
			args: sdp
		},
		time: Date.now()
	};
	return msg;
};