import React from "react";
import { connect, ConnectedProps } from "react-redux";

import { WsMessage, ChatMessageState } from "../../state/message-types";
import { State } from "../../state/store";
import { chatMessageAction } from "../../state/action-creators";

const logger = console;

interface TextState {
	message: string,
	target: React.RefObject<HTMLTextAreaElement>,
}

const mapPropsToState = (store: State) => {
	return {
		socket: store.websocket.socket,
		loggedIn: store.connectState.loggedIn,
		connected: store.connectState.connected,
		username: store.connectState.username,
		selectedUsers: store.selectedUsers
	};
};

const mapPropsToDispatch = {
	sendMessage: chatMessageAction
};

const textInputConnector = connect(mapPropsToState, mapPropsToDispatch);
type PropsFromReduxLogin = ConnectedProps<typeof textInputConnector>;

class ChatInput extends React.Component<PropsFromReduxLogin, TextState> {
	message: string;
	target: React.RefObject<HTMLTextAreaElement>;
	ctlKeyDown: boolean;

  constructor(props: PropsFromReduxLogin) {
		super(props);
		this.message = "";
		this.target = React.createRef();
		this.ctlKeyDown = false;

		this.state = {
			message: this.message,
			target: this.target,
		};
	}

	dataHandler = (evt: React.ChangeEvent<HTMLTextAreaElement>) => {
		this.setState({
			message: evt.target.value
		});

		if (evt.target.value.includes("\n")) {
			this.sendMessage();
		}
	}

	onDown = (evt: React.KeyboardEvent) => {
		if (evt.key === "Control") {
			this.ctlKeyDown = true;
		}

		if (evt.key === "Enter" && this.ctlKeyDown) {
			this.sendMessage();
		}
	}

	onUp = (evt: React.KeyboardEvent) => {
		if (evt.key === "Control") {
			this.ctlKeyDown = false;
		}
	}

	private sendMessage = () => {
		// check to see if we are addressing individual member
		let recipients: string[] = Array.from(this.props.connected);
		if (this.props.selectedUsers.length > 0) {
			recipients = this.props.selectedUsers;
			// Always include ourself in the recipients list
			if (!this.props.selectedUsers.includes(this.props.username)) {
				recipients.push(this.props.username);
			}
		}

		if (this.state.message.startsWith("[")) {
			let results = this.state.message.split(/\[(.+)\]/);
			results = results.filter(r => r !== "");
			if (results.length === 0) {
				alert("error parsing message.  Format is:\n[@user1,@user2] message");
				return;
			}
			recipients = results[0].split(",").map(user => user.replace("@", ""));
		}
		const msg = this.makeWSMessage(this.state.message);
    msg.recipients = recipients;

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
	}

	send = (evt: React.MouseEvent<HTMLButtonElement>) => {
		this.sendMessage();
	}

	makeWSMessage = (body: string, recipients: string[] = []): WsMessage<string> => {
		if (recipients.length === 0) {
			recipients = Array.from(this.props.connected);
		}

		const msg: WsMessage<string> = {
			sender: this.props.username,
			recipients,
			body,
			event_type: "Message",
			time: Date.now()
		};

		return msg;
	}

	render() {
		return(
			<div className="chat-input">
				<div className="field-group">
					<textarea className="chat-text"
						cols={ 1 }
						wrap={ "hard" }
						ref={ this.target }
						onKeyDown={ this.onDown }
						onKeyUp={ this.onUp }
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