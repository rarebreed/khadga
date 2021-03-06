import * as React from "react";
import {connect, ConnectedProps} from "react-redux";
import {Subject} from "rxjs";

import {State} from "../state/store";
import {
  setActive,
  createLoginAction,
  setLoginFormAction,
  webcamCamAction,
  chatMessageAction,
  videoRefAction,
  remoteVideoAction,
  mainTabAction
} from "../state/action-creators";
import {
  WEBCAM_ENABLE,
  WebcamState
} from "../state/types";
import {NavBarItem, NavBarDropDown} from "./navbar-item";
import GoogleAuth from "./google-signin";
import WebCamSettings from "../components/webrtc/settings";
import {WebComm} from "../state/communication";

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
    camState: state.webcam,
    videoRef: state.videoRef.videoRefId
  };
};

const mapDispatch = {
  signUp: setActive,
  connection: createLoginAction,
  setLoginForm: setLoginFormAction,
  webcam: webcamCamAction,
  chatMessage: chatMessageAction,
  video: videoRefAction,
  remoteVideo: remoteVideoAction,
  activeTab: mainTabAction
};

const connector = connect(mapState, mapDispatch);
type PropsFromRedux = ConnectedProps<typeof connector> & {
  webcomm: WebComm
};

interface AppSettings {
  videoSubj: Subject<MediaDeviceInfo>;
  audioOutSubj: Subject<MediaDeviceInfo>;
  audioInSubj: Subject<MediaDeviceInfo>;
}

class NavBar extends React.Component<PropsFromRedux> {
  videoSubj: Subject<MediaDeviceInfo>;
  audioOutSubj: Subject<MediaDeviceInfo>;
  audioInSubj: Subject<MediaDeviceInfo>;
  webcomm: WebComm;

  constructor(props: PropsFromRedux) {
    super(props);

    this.videoSubj = new Subject();
    this.audioOutSubj = new Subject();
    this.audioInSubj =  new Subject();
    this.webcomm = props.webcomm;

    // Rx-ify our state.  When webcam settings changes, it will call next(), so we subscribe here
    this.videoSubj.subscribe({
      next: (val) => {
        const webcamState: WebcamState = {
          active: this.props.camState.active,
          videoId: val.deviceId
        };

        this.props.webcam(webcamState, WEBCAM_ENABLE);
      },
      error: err => logger.error(`Got error: ${err}`),
      complete: () => logger.info("Subject stream is complete")
    });
  }

  /**
   * Sets up webcam
   *
   * This sets off a chain of events that will launch the webcam.  By calling this.props.webcam, it
   * sets the state of the webcam.active to true.  That in turn causes the ChatContainer component 
   * to react to the new state, and create the VideoCam component.
   */
  launchWebCam = (_: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
    if (!this.props.loggedIn) {
      alert("Please log in first");
      return;
    }
    
    const webcamState = {
      active: true
    };

    this.props.webcam(webcamState, WEBCAM_ENABLE);
    return;
  }

  /**
   * Creates the WebComm object that handles the state for the websocket and MediaStreams
   */
  createWebComm = (_: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
    if (!this.props.loggedIn) {
      alert("Please log in first");
      return;
    }

    // At this point, we should be logged in, so pass the username to webcomm
    // This will generate the websocket for this user.  This is why we are calling user$.next()
    // here, rather than in the GoogleAuth component.  We only need the websocket if the user wants
    // to chat
    this.webcomm.user$.next(this.props.user);

    // We also need to tell the TabNav to make the chat Tab the active window.
    this.props.activeTab("chat", "SET_ACTIVE_TAB");
  }

  setBlog = (_: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
    this.props.activeTab("blog", "SET_ACTIVE_TAB");
  }

  setCreate = (_: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
    if (!this.props.loggedIn) {
      alert("You are not logged in.  Blog will be saved in local indexed store")
    }
    this.props.activeTab("editor", "SET_ACTIVE_TAB");
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
                onClick={ this.setBlog }>Welcome</a>
              <a className="dropdown-item"
                href="#"
                onClick={ this.createWebComm }>Chat</a>
              <a className="dropdown-item"
                href="#"
                onClick={ this.setCreate }>Create Blog</a>
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
            <GoogleAuth webcomm={ this.webcomm }/>
          </div>
        </div>

      </nav>
    );
  }
}

export default connector(NavBar);