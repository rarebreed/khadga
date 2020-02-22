import React from "react";
import { connect, ConnectedProps } from "react-redux";

import { WsMessage, ChatMessageState } from "../../state/message-types";
import { State } from "../../state/store";
import { chatMessageAction } from "../../state/action-creators";

const logger = console;

interface TextState {
	message: string,
	target: React.RefObject<HTMLInputElement>
}

const mapPropsToState = (store: State) => {
	return {
		socket: store.websocket.socket,
		loggedIn: store.connectState.loggedIn,
		connected: store.connectState.connected,
		username: store.connectState.username
	};
};

const mapPropsToDispatch = {
	sendMessage: chatMessageAction
};

const textInputConnector = connect(mapPropsToState, mapPropsToDispatch);
type PropsFromReduxLogin = ConnectedProps<typeof textInputConnector>;

class ChatInput extends React.Component<PropsFromReduxLogin, TextState> {
	message: string;
	target: React.RefObject<HTMLInputElement>;

  constructor(props: PropsFromReduxLogin) {
		super(props);
		this.message = "";
		this.target = React.createRef();

		this.state = {
			message: this.message,
			target: this.target
		};
	}

	dataHandler = (evt: React.ChangeEvent<HTMLInputElement>) => {
		this.setState({
			message: evt.target.value
		});
	}

	send = (evt: React.MouseEvent<HTMLButtonElement>) => {
		const msg = this.makeMessage(this.state.message);
    msg.recipients = Array.from(this.props.connected);

		logger.log(`sending`, msg);
		if (this.props.socket) {
			this.props.socket.send(JSON.stringify(msg));
		} else {
			logger.log("this.ws:", this.props);
			alert("No websocket connection.\nLog out and back in");
		}

		if (this.target.current) {
			this.target.current.value = "";
		}

		this.setState({
			message: ""
		});

		// Even though we could send a message directly to the chat-container, we will wait for the
		// back end to send it back.
		// this.props.sendMessage(this.makeChatMessage(msg), CHAT_MESSAGE_ADD);
	}

	makeMessage = (body: string, recipients: string[] = []): WsMessage<string> => {
		if (recipients.length === 0) {
			recipients = Array.from(this.props.connected);
		}

		const msg: WsMessage<string> = {
			sender: this.props.username,
			recipients,
			body,
			event_type: "Message"
		};

		return msg;
	}

	makeChatMessage = (msg: WsMessage<string>): ChatMessageState => {
		return {
			sender: msg.sender,
			recipients: msg.recipients,
			body: msg.body,
			time: new Date().toUTCString()
		};
	}

	render() {
		return(
			<div className="chat-input">
				<div className="field-group">
					<input type="text"
					       ref={ this.target }
								 onInput={ this.dataHandler } />
					<button onClick={ this.send }>
						Send
					</button>
				</div>
			</div>
		);
	}
}

export default textInputConnector(ChatInput);