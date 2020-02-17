/**
 * Text area container
 */

import React from "react";
import { connect, ConnectedProps } from "react-redux";

import { WsMessage, ChatMessageState, CHAT_MESSAGE_ADD } from "../../state/types";
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
		username: store.login.username
	};
};

const mapPropsToDispatch = {
	sendMessage: chatMessageAction
};

const textInputConnector = connect(mapPropsToState, mapPropsToDispatch);
type PropsFromReduxLogin = ConnectedProps<typeof textInputConnector>;

class TextInput extends React.Component<PropsFromReduxLogin, TextState> {
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

		logger.log(`sending ${msg}`);
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

		this.props.sendMessage(this.makeChatMessage(msg), CHAT_MESSAGE_ADD);
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
		const shouldShow = this.props.socket && this.props.loggedIn;
		let cName = shouldShow ? "" : " is-hidden";
		cName = "field has-addons" + cName;

		return (
			<div className={ cName }>
				<div className="control is-expanded">
					<input className="input is-info"
					       ref={ this.target }
								 type="text"
								 onInput={ this.dataHandler }></input>
				</div>
				<div className="control">
					<button className="button is-info" onClick={ this.send }>Send</button>
				</div>
			</div>
		);
	}
}

export default textInputConnector(TextInput);