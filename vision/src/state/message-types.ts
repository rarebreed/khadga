export type MessageEvent = "Connect" | "Disconnect" | "Message" | "Data" | "Command";

export const CHAT_MESSAGE_ADD = "CHAT_MESSAGE_ADD";
export const CHAT_MESSAGE_DELETE = "CHAT_MESSAGE_DELETE";
export const CHAT_MESSAGE_EDIT = "CHAT_MESSAGE_EDIT";
export const CHAT_MESSAGE_REPLY = "CHAT_MESSAGE_REPLY";
export type CHAT_MESSAGE_ACTIONS = "CHAT_MESSAGE_ADD"
																 | "CHAT_MESSAGE_DELETE"
																 | "CHAT_MESSAGE_EDIT"
																 | "CHAT_MESSAGE_REPLY";

export interface UserConnectionEventMessage {
	connected_users: string[]
}

/// This is the typescript equivalent of the message::Message type
export interface WsMessage<T> {
	sender: string,
	recipients: string[],
	body: T
	event_type: MessageEvent
}

export interface ChatMessageState {
	sender: string,
	recipients: string[],
	time: string,
	body: string
	replies?: ChatMessageState
}

/**
 * Actions for chat messages
 */
export interface ChatMessageAction {
	type: CHAT_MESSAGE_ACTIONS
	message: ChatMessageState
}


export const makeChatMessage = (msg: WsMessage<string>): ChatMessageState => {
	return {
		sender: msg.sender,
		recipients: msg.recipients,
		body: msg.body,
		time: new Date().toUTCString()
	};
}