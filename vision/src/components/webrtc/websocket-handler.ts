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

const logger = console;

interface WSSetup {
	auth: any,
	user: string,
	loginAction: typeof createLoginAction,
	setWebsocket: typeof websocketAction,
	chatAction: typeof chatMessageAction
}

interface ConnectionEvent {
  connected_users: string[]
}

export const socketSetup = (socket: WebSocket, props: WSSetup) => {
	socket.onopen = (ev: Event) => {
		logger.log("Now connected to khadga");
		// Pass along our websocket so the Chat components can use it
		props.setWebsocket(socket);
	};

	socket.onmessage = (evt: MessageEvent) => {
		// TODO: use the data in the event to update the user list.
		const msg: WsMessage<any> = JSON.parse(evt.data);
		const auth = props.auth;

		logger.debug(`Got message: `, msg);
		const cmdHandler = commandHandler(socket, props);

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

const pingRequestHandler = (socket: WebSocket) => (msg: WsMessage<any>, user: string) => {
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
	socket.send(JSON.stringify(replyMsg));
	logger.debug(`Sent reply: `, replyMsg);
};

const commandHandler = (socket: WebSocket, props: WSSetup) => (msg: WsMessage<any>) => {
	const cmd = msg.body as WsCommand<any>;
	logger.debug(`command is =`, cmd);

	const pingHandler = pingRequestHandler(socket);

	switch(cmd.cmd.op) {
		case "Ping":
			pingHandler(msg, props.user);
			break;
		case "IceCandidate":
			break;
		default:
			logger.log(`Unknown command ${msg.event_type}.  Doing nothing`);
			return;
	}
};