/**
 * Text area container
 */

import React from "react";
import { connect, ConnectedProps } from "react-redux";

import { WsMessage, WebSocketState } from "../../state/types";
import { State } from "../../state/store";
import { state } from "../../state/reducers";

const logger = console;

interface TextState {
	message: string
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
	ws: WebSocketState;
	message: string;

  constructor(props: PropsFromReduxLogin) {
		super(props);
		this.ws = {
			socket: props.socket
		};
		this.message = "";

		this.state = {
			message: this.message
		};
	}

	dataHandler = (evt: React.ChangeEvent<HTMLInputElement>) => {
		logger.log(evt.target.value);

		this.setState({
			message: evt.target.value
		});
	}

	send = (_: React.MouseEvent<HTMLButtonElement>) => {
		const msg = this.makeMessage(this.state.message);
		logger.log(`socket is ${this.ws.socket}`);
		if (this.ws.socket !== null) {
			this.ws.socket.send(JSON.stringify(msg));
		} else {
			alert("No websocket connection.\nLog out and back in");
		}
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
				  <input className="input is-info" type="text" onInput={ this.dataHandler }></input>
				</div>
				<div className="control">
					<button className="button is-info" onClick={ this.send }>Send</button>
				</div>
			</div>
		);
	}
}

export default textInputConnector(TextInput);