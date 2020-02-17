/**
 * Text area container
 */

import React from "react";
import { connect, ConnectedProps } from "react-redux";

import { WsMessage } from "../../state/types";
import { State } from "../../state/store";

const logger = console;

interface TextState {
	message: string,
	target: React.RefObject<HTMLInputElement>
}

const mapPropsToState = (store: State) => {
	return {
		socket: store.websocket.socket,
		loggedIn: store.connectState.loggedIn
	};
};

const textInputConnector = connect(mapPropsToState);
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
	}

	makeMessage = (body: string): WsMessage<string> => {
		const msg: WsMessage<string> = {
			sender: "",
			recipients: [],
			body,
			event_type: "Message"
		};

		return msg;
	}

	render() {
		let cName = this.props.loggedIn ? "" : " is-hidden";
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