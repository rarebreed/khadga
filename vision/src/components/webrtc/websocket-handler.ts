import { Subject } from "rxjs";
import { combineLatest, flatMap } from "rxjs/operators";

import {
	createLoginAction,
	websocketAction,
	chatMessageAction
} from "../../state/action-creators";
import { USER_CONNECTION_EVT } from "../../state/types";
import {
	WsMessage,
	makeChatMessage,
	CHAT_MESSAGE_ADD,
	WsCommand
} from "../../state/message-types";
import { createPeerConnection, RTCSetup, closeVideoCall } from "./connection";

const logger = console;

export interface WSSetup {
	auth: any,
	user: string,
	loginAction: typeof createLoginAction,
	setWebsocket: typeof websocketAction,
	chatAction: typeof chatMessageAction,
	videoRef: React.RefObject<HTMLVideoElement>
}

export interface ConnectionEvent {
	connected_users: string[]
}

/**
 * Creates the interface for the createPeerConnection
 */
const makeRTCSetup = (
	sockSubj: Subject<string>,
	connectSubj: Subject<[string, string]>,
	videoRef: React.RefObject<HTMLVideoElement>
): RTCSetup => {
	return {
		sockSubj,
		connectSubj,
		videoRef
	};
};

/**
 * Sets up websockets for use by the SPA
 * 
 * FIXME:  What I don't like here is that we are conflating text based messaging handling with the
 * WebRTC handling.  Ideally, this setup should only be for text based handling.  Another method
 * should handle the SDP/ICE messages that setup RTCPeerConnection and Sesssions.
 *
 * @param socket
 * @param props
 */
export const socketSetup = (
	peer$: Subject<RTCPeerConnection>,
	socket: WebSocket,
	props: WSSetup
) => {
	logger.log("Setting up websocket");
	// Socket Subject
	const sockSubj: Subject<string> = new Subject();
	sockSubj.subscribe({
		next: (msg) => socket.send(msg),
		error: (err) => logger.error(err),
		complete: () => logger.log("sockSubj has completed")
	});

	// Connection subject which is a tuple of [sender, receiver].
	const connectSubj: Subject<[string, string]> = new Subject();
	const peerArgs = makeRTCSetup(sockSubj, connectSubj, props.videoRef);
	createPeerConnection(peer$, peerArgs);

	socket.onopen = (ev: Event) => {
		logger.log("Now connected to khadga");
		// Pass along our websocket so the Chat components can use it
		props.setWebsocket(socket);
	};

	socket.onmessage = (evt: MessageEvent) => {
		const msg: WsMessage<any> = JSON.parse(evt.data);
		const auth = props.auth;

		logger.debug(`Got message: `, msg);
		const cmdHandler = commandHandler(peer$, peerArgs, props);

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
				cmdHandler(msg);
				break;
			default:
				logger.log("Unknown message type", msg.event_type);
		}
	};

	socket.onclose = (ev: CloseEvent) => {
		props.setWebsocket(null);
	};
};

/**
 * Handles a Ping type of WsCommand, used as a keep alive mechanism
 *
 * @param socket
 */
const pingRequestHandler = (socket: Subject<string>) => (msg: WsMessage<any>, user: string) => {
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
				id: user
			},
			args
		})
	};
	socket.next(JSON.stringify(replyMsg));
	logger.debug(`Sent reply: `, replyMsg);
};

/**
 * Handles any messages over the websocket with a event_type of CommandRequest
 *
 * @param socket
 * @param props
 */
const commandHandler = (
	peer$: Subject<RTCPeerConnection>,
	peerArgs: RTCSetup,
	props: WSSetup
) => (msg: WsMessage<any>) => {
		const cmd = msg.body as WsCommand<any>;
		logger.debug(`command is =`, cmd);
		let transceiver;

		/**
		 * Handler for when client receives a request for a videochat
		 * 
		 * @param peer 
		 */
		const handleVideoOffer = async (peer: RTCPeerConnection) => {
			const mesg = msg as WsMessage<WsCommand<RTCSessionDescription>>;
			logger.log("Received video chat offer from ", mesg.sender);
			const desc = new RTCSessionDescription(mesg.body.args);

			if (peer.signalingState !== "stable") {
				// Set the local and remove descriptions for rollback; don't proceed until returned
				logger.log("  - But the signaling state isn't stable, so triggering rollback");
				await Promise.all([
					peer.setLocalDescription({ type: "rollback" }),
					peer.setRemoteDescription(desc)
				]);
				return false;
			} else {
				logger.log("  - Setting remote description");
				await peer.setRemoteDescription(desc);
			}

			// Get the media stream
			const { current } = peerArgs.videoRef;
			if (current && current.srcObject) {
				const webcamStream: MediaStream = current.srcObject as MediaStream;

				try {
					webcamStream.getTracks().forEach(
						transceiver = (track: MediaStreamTrack) => {
							peer.addTransceiver(track, { streams: [webcamStream] });
						}
					);
				} catch (err) {
					handleGetUserMediaError(err, peer);
					return false;
				}
			}
			return true;
		};

		// Ping handler for when khadga backend pings the client
		const pingHandler = pingRequestHandler(peerArgs.sockSubj);

		// Create a handler for when messages for session offers are made
		const sdp$: Subject<WsMessage<WsCommand<RTCSessionDescription>>> = new Subject();
		const sdpOfferHandler$ = sdp$.pipe(
			combineLatest(peer$),
			flatMap((res) => {
				const [sdpmsg, peer] = res;
				return handleVideoOffer(peer);
			})
		);

		sdpOfferHandler$.subscribe({
			next: (res) => {
				logger.log("Handling of video offer successful? ", res);
			}
		});

		switch (cmd.cmd.op) {
			case "Ping":
				pingHandler(msg, props.user);
				break;
			case "IceCandidate":
				break;
			case "SDPOffer":
				sdp$.next(msg);
				break;
			default:
				logger.log(`Unknown command ${msg.event_type}.  Doing nothing`);
				return;
		}
	};

// Handle errors which occur when trying to access the local media
// hardware; that is, exceptions thrown by getUserMedia(). The two most
// likely scenarios are that the user has no camera and/or microphone
// or that they declined to share their equipment when prompted. If
// they simply opted not to share their media, that's not really an
// error, so we won't present a message in that situation.

function handleGetUserMediaError(e: Error, peer: RTCPeerConnection) {
	logger.error(e);
	switch (e.name) {
		case "NotFoundError":
			alert("Unable to open your call because no camera and/or microphone" +
				"were found.");
			break;
		case "SecurityError":
		case "PermissionDeniedError":
			// Do nothing; this is the same as the user canceling the call.
			break;
		default:
			alert("Error opening your camera and/or microphone: " + e.message);
			break;
	}

	// Make sure we shut down our end of the RTCPeerConnection so we're
	// ready to try again.
	closeVideoCall(peer);
}