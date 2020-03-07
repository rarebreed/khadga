import * as React from "react";
import { connect, ConnectedProps } from "react-redux";

import { State } from "../state/store";
import { setActive
       , createLoginAction
       , setLoginFormAction
       , webcamCamAction
       , websocketAction
       , chatMessageAction
       } from "../state/action-creators";
import { USER_CONNECTION_EVT
       , WEBCAM_ENABLE
       , WebSocketState
       } from "../state/types";
import { WsMessage
       , makeChatMessage
       , CHAT_MESSAGE_ADD
       , WsCommand
       } from "../state/message-types";
import * as noesis from "@khadga/noesis";
import { NavBarItem, NavBarDropDown } from "./navbar-item";
import GoogleAuth from "./google-signin";
import { socketSetup } from "./webrtc/websocket-handler";

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
    // logger.log(JSON.stringify(mediaDevs));
    const webcamState = {
      active: true
    };

    this.props.webcam(webcamState, WEBCAM_ENABLE);
    return;
  }

  /**
   * Handles messages coming from the websocket
   */
  messageHandler = (socket: WebSocket) => {
    socketSetup(socket, {
      user: this.props.user,
      auth: this.props.auth,
      loginAction: this.props.connection,
      chatAction: this.props.chatMessage,
      setWebsocket: this.props.websocket
    });
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
    const url = `wss://${origin}/chat/${this.props.user}`;
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
        <div className="navbar">
          <div className="navsection">
            <img src="khadga-logo-cropped.png"
                 alt="khadga"
                 height="42px"
                 className="fit" />
            <NavBarItem href="https://rarebreed.github.com">About</NavBarItem>
            <NavBarDropDown value="Menu">
              <a className="dropdown-item"
                  href="#"
                  onClick={ this.setupChat }>Chat</a>
              <a className="dropdown-item"
                  href="#"
                  onClick={ this.setupWebcam }>Webcam</a>
            </NavBarDropDown>
          </div>
          <div className="navsection justify-right">
            <GoogleAuth />
          </div>
        </div>

			</nav>
		);
	}
}

export default connector(NavBar);