import * as React from "react";
import { connect, ConnectedProps } from "react-redux";

import { State } from "../state/store";
import { setActive
       , createLoginAction
       , setLoginFormAction
       , webcamCamAction
       , websocketAction,
       chatMessageAction
       } from "../state/action-creators";
import { USER_CONNECTION_EVT
       , WEBCAM_ENABLE
       , WebSocketState
       } from "../state/types";
import { WsMessage
       , makeChatMessage
       , CHAT_MESSAGE_ADD
       } from "../state/message-types";
import * as noesis from "@khadga/noesis";
import { NavBarItem } from "./navbar-item";
import GoogleAuth from "./google-signin";

const logger = console;


/**
 * Used for ConnectedComponent to map the state to properties
 *
 * This is a common convention with redux
 *
 * @param state
 */
const mapState = (state: State) => {
  return {
    user: state.connectState.username,
    modal: state.modal,
    loggedIn: state.connectState.loggedIn,
    connected: state.connectState.connected,
		auth: state.connectState.auth2,
    socket: state.websocket.socket
  };
};

const mapDispatch = {
  signUp: setActive,
  connection: createLoginAction,
  setLoginForm: setLoginFormAction,
  webcam: webcamCamAction,
  websocket: websocketAction,
  chatMessage: chatMessageAction
};

const connector = connect(mapState, mapDispatch);
type PropsFromRedux = ConnectedProps<typeof connector>;

interface ConnectionEvent {
  connected_users: string[]
}

class NavBar extends React.Component<PropsFromRedux> {
	/**
	 * Sets up webcam
	 *
	 * Currently, this is not hooked up to the Signaling service at all.  This will only get the local
	 * webcam video stream, not another user's webcam stream
	 */
	setupWebcam = (_: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
    const mediaDevs = noesis.list_media_devices();
    logger.log(JSON.stringify(mediaDevs));
    const webcamState = {
      active: true
    };

    this.props.webcam(webcamState, WEBCAM_ENABLE);
    return;
  }

  messageHandler = (socket: WebSocket) => {
    socket.onopen = (ev: Event) => {
      logger.log("Now connected to khadga");
      // Pass along our websocket so the Chat components can use it
      this.props.websocket(socket);
    };

    socket.onmessage = (evt: MessageEvent) => {
      // TODO: use the data in the event to update the user list.
      const msg: WsMessage<any> = JSON.parse(evt.data);
      logger.log("Got websocket event", msg);
      const auth = this.props.auth;

      switch(msg.event_type) {
        case "Disconnect":
        case "Connect":
          const { connected_users } = msg.body as ConnectionEvent;
          this.props.connection(connected_users, "", auth, USER_CONNECTION_EVT);
          break;
        case "Data":
          logger.log(msg);
          break;
        case "Message":
          this.props.chatMessage(makeChatMessage(msg), CHAT_MESSAGE_ADD);
          break;
        case "Command":
          logger.log(`Got command message`, msg);
          break;
        default:
          logger.log("Unknown message type");
      }
    };

    socket.onclose = (ev: CloseEvent) => {
      this.props.websocket(null);
    };
  }

	/**
	 * Performs initial handshake with the khadga backend to establish a websocket
	 */
  setupChat = (_: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
    if (!this.props.loggedIn) {
      alert("Please Log in first");
      return;
    }

    const origin = window.location.host;
    const url = `ws://${origin}/chat/${this.props.user}`;
    logger.log(`Connecting to ${url}`);
    const sock: WebSocketState = {
      socket: null
    };

    if (!this.props.socket) {
      sock.socket = new WebSocket(url);

      const socket = sock.socket;
      this.messageHandler(socket);

    } else {
      logger.log(`In setupChat`, this.props);
    }
	}

	render() {
		return (
			<nav className="navbar-grid-area">
				<ul className="navbar">
					<NavBarItem callback={ this.setupChat }>Chat</NavBarItem>
          <NavBarItem callback={ this.setupWebcam }>Webcam</NavBarItem>
					<GoogleAuth />
				</ul>
			</nav>
		);
	}
}

export default connector(NavBar);