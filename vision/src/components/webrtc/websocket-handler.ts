import { Subject } from "rxjs";
import { combineLatest, map } from "rxjs/operators";

import { createLoginAction
	     , websocketAction
	     , chatMessageAction
	     } from  "../../state/action-creators";
import { USER_CONNECTION_EVT } from "../../state/types";
import { WsMessage
		   , makeChatMessage
		   , CHAT_MESSAGE_ADD
		   , WsCommand
		   } from "../../state/message-types";
import { createPeerConnection, RTCSetup, SDPMessage } from "./sdp";

const logger = console;

interface WSSetup {
	auth: any,
	user: string,
	loginAction: typeof createLoginAction,
	setWebsocket: typeof websocketAction,
	chatAction: typeof chatMessageAction,
	videoRef: React.RefObject<HTMLVideoElement>
}

interface ConnectionEvent {
  connected_users: string[]
}

/**
 * Creates the interface for the createPeerConnection
 */
const makeRTCSetup = ( sockSubj: Subject<string>
										 , connectSubj: Subject<[string, string]>
										 , videoRef: React.RefObject<HTMLVideoElement>)
										 : RTCSetup => {
  return {
		sockSubj,
		connectSubj,
		videoRef
	};
};

/**
 * Sets up websockets for use by the SPA
 *
 * @param socket
 * @param props
 */
export const socketSetup = ( peer$: Subject<RTCPeerConnection>
													 , socket: WebSocket
													 , props: WSSetup) => {
	// Socket Subject
	const sockSubj: Subject<string> = new Subject();
	sockSubj.subscribe({
		next: (msg) => socket.send(msg),
		error: (err) => logger.error(err),
		complete: () => logger.log("sockSubj has completed")
	});
	// Connection subject
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

		switch(msg.event_type) {
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

const handleVideoOffer = async ( peer: RTCPeerConnection
													     , peerArgs: RTCSetup
	                             , msg: WsMessage<WsCommand<RTCSessionDescription>>) => {
	logger.log("Received video chat offer from ", msg.sender);
	const desc = new RTCSessionDescription(msg.body.args);

	if (peer.signalingState !== "stable") {
		logger.log("  - But the signaling state isn't stable, so triggering rollback");

    // Set the local and remove descriptions for rollback; don't proceed
    // until both return.
    await Promise.all([
      peer.setLocalDescription({type: "rollback"}),
      peer.setRemoteDescription(desc)
    ]);
    return;
	} else {
    logger.log("  - Setting remote description");
    await peer.setRemoteDescription(desc);
	}

	const { current } = peerArgs.videoRef;
	if (current && !current.srcObject) {

	}
};

/**
 * Handles any messages over the websocket with a event_type of CommandRequest
 *
 * @param socket
 * @param props
 */
const commandHandler = ( peer$: Subject<RTCPeerConnection>
											 , peerArgs: RTCSetup
											 , props: WSSetup) => (msg: WsMessage<any>) => {
	const cmd = msg.body as WsCommand<any>;
	logger.debug(`command is =`, cmd);

	const pingHandler = pingRequestHandler(peerArgs.sockSubj);
	const sdp$: Subject<WsMessage<WsCommand<RTCSessionDescription>>> = new Subject();
	const sdpOfferHandler$ = sdp$.pipe(
		combineLatest(peer$),
		map((res) => {
			const [sdpmsg, peer] = res;
			return handleVideoOffer(peer, peerArgs, sdpmsg);
		})
	);

	switch(cmd.cmd.op) {
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