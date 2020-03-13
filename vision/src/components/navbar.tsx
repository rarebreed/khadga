import * as React from "react";
import { connect, ConnectedProps } from "react-redux";
import { Subject } from "rxjs";

import { State } from "../state/store";
import { setActive
       , createLoginAction
       , setLoginFormAction
       , webcamCamAction
       , websocketAction
       , chatMessageAction
       , videoRefAction
       } from "../state/action-creators";
import { WEBCAM_ENABLE
       , WebSocketState
       , WebcamState
       } from "../state/types";
import { NavBarItem, NavBarDropDown } from "./navbar-item";
import GoogleAuth from "./google-signin";
import { socketSetup } from "./webrtc/websocket-handler";
import WebCamSettings from "../components/webrtc/settings";

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
    socket: state.websocket.socket,
    camState: state.webcam,
    videoRef: state.videoRef.videoRefId
  };
};

const mapDispatch = {
  signUp: setActive,
  connection: createLoginAction,
  setLoginForm: setLoginFormAction,
  webcam: webcamCamAction,
  websocket: websocketAction,
  chatMessage: chatMessageAction,
  video: videoRefAction
};

const connector = connect(mapState, mapDispatch);
type PropsFromRedux = ConnectedProps<typeof connector>;

interface AppSettings {
  videoSubj: Subject<MediaDeviceInfo>;
  audioOutSubj: Subject<MediaDeviceInfo>;
  audioInSubj: Subject<MediaDeviceInfo>;
}

class NavBar extends React.Component<PropsFromRedux> {
  videoSubj: Subject<MediaDeviceInfo>;
  audioOutSubj: Subject<MediaDeviceInfo>;
  audioInSubj: Subject<MediaDeviceInfo>;
  // FIXME: Not really the place for either of these, but not in redux either
  peer$: Subject<RTCPeerConnection>;
  videoRef: React.RefObject<HTMLVideoElement>;

  constructor(props: PropsFromRedux) {
    super(props);

    this.videoSubj = new Subject();
    this.audioOutSubj = new Subject();
    this.audioInSubj =  new Subject();
    this.peer$ = new Subject();
    this.videoRef = React.createRef();

    // make sure the videoRef is available if user clicks Webcam
    this.props.video(this.videoRef, "SET_VIDEO_REF");

    // Rx-ify our state.  When settings changes, it will call next(), so we subscribe here
    this.videoSubj.subscribe({
      next: (val) => {
        const webcamState: WebcamState = {
          active: this.props.camState.active,
          videoId: val.deviceId
        };

        this.props.webcam(webcamState, WEBCAM_ENABLE);
      },
      error: (err) => logger.error(`Got error: ${err}`),
      complete: () => logger.info("Subject stream is complete")
    });
  }

	/**
	 * Sets up webcam
	 *
	 * Currently, this is not hooked up to the Signaling service at all.  This will only get the local
	 * webcam video stream, not another user's webcam stream.  This sets off a chain of events that
	 * will launch the webcam.  By calling this.props.webcam, it sets the state of the webcam.active
	 * to true.  That in turn causes the ChatContainer component to react to the new state, and create
	 * the VideoCam component.
	 */
	launchWebCam = (_: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
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
    socketSetup(this.peer$, socket, {
      user: this.props.user,
      auth: this.props.auth,
      loginAction: this.props.connection,
      chatAction: this.props.chatMessage,
      setWebsocket: this.props.websocket,
      videoRef: this.videoRef
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
                  onClick={ this.launchWebCam }>Webcam</a>
              <a className="sub-menu dropdown-item"
                 href="#">
                Webcam Settings
                <WebCamSettings speakerSubj={ this.audioOutSubj }
                                microphoneSubj={ this.audioInSubj }
                                videoSubj={ this.videoSubj } ></WebCamSettings>
              </a>
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