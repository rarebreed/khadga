import * as React from "react";
import { connect, ConnectedProps } from "react-redux";

import { SignUp } from "./signup";
import { State } from "../state/store";
import { setActive
       , createLoginAction
       , setLoginFormAction
       , webcamCamAction
       , websocketAction
       } from "../state/action-creators";
import { logger } from "../logger";
import { SET_SIGNUP_ACTIVE
       , SET_LOGIN_ACTIVE
       , USER_DISCONNECT
       , USER_CONNECTION_EVT
       , WEBCAM_ENABLE
       , WsMessage
       } from "../state/types";
import  Login from "./login";
import * as noesis from "@khadga/noesis";

interface INavBarItemProps {
  item: string,
  href?: string
  callback?: (evt: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => void
}

class NavBarItem extends React.Component<INavBarItemProps> {
  render() {
    return (
      <a className="navbar-item" href={this.props.href} onClick={ this.props.callback }>
        { this.props.item }
      </a>
    );
  }
}

interface INavBarLinkProps {
  link: string
}

class NavBarLink extends React.Component<INavBarLinkProps> {
  render() {
    return (
      <a className="navbar-link">
        { this.props.link }
      </a>
    );
  }
}

/**
 * Used for ConnectedComponent to map the state to properties
 *
 * This is a common convention with redux
 *
 * @param state
 */
const mapState = (state: State) => {
  return {
    user: state.login.username,
    modal: state.modal,
    loggedIn: state.connectState.loggedIn
  };
};

const mapDispatch = {
  signUp: setActive,
  connection: createLoginAction,
  setLoginForm: setLoginFormAction,
  webcam: webcamCamAction,
  websocket: websocketAction
};

const connector = connect(mapState, mapDispatch);
type PropsFromRedux = ConnectedProps<typeof connector>;

class NavBar extends React.Component<PropsFromRedux> {
  sock: WebSocket | null;

  constructor(props: PropsFromRedux) {
    super(props);
    this.sock = null;
  }

  signUpHandler = (_: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
    this.props.signUp(true, SET_SIGNUP_ACTIVE);
  }

  setLogin = (_: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
    logger.log("In setLogin");
    this.props.signUp(true, SET_LOGIN_ACTIVE);
  }

  logout = (_: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
    this.props.connection(new Set(), this.props.user, USER_DISCONNECT);
  }

  isLoggedIn = () => {
    const buttons = (
      <div className="buttons">
        <a className="button is-primary" onClick={ this.signUpHandler }>
          <strong>Sign up</strong>
        </a>
        <a className="button is-light" onClick={ this.setLogin }>
          Log in
        </a>
      </div>
    );

    const logout = (
      <div className="buttons">
        <a className="button is-primary" onClick={ this.logout }>
          <strong>Log Out</strong>
        </a>
      </div>
    );

    return this.props.loggedIn ? logout : buttons;
  }

  setupWebcam = (_: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
    const mediaDevs = noesis.list_media_devices();
    logger.log(JSON.stringify(mediaDevs));
    const webcamState = {
      active: true
    };

    this.props.webcam(webcamState, WEBCAM_ENABLE);
    return;
  }

  setupChat = (_: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
    const origin = window.location.host;
    const url = `ws://${origin}/chat/${this.props.user}`;
    logger.log(`Connecting to ${url}`);
    this.sock = new WebSocket(url);

    // Pass along our websocket so the Chat components can use it
    this.props.websocket(this.sock);

    this.sock.onopen = (ev: Event) => {
      logger.log("Now connected to khadga");
    };

    this.sock.onmessage = (evt: MessageEvent) => {
      // TODO: use the data in the event to update the user list.
      const msg: WsMessage<{ connected_users: Set<string> }> = JSON.parse(evt.data);
      logger.log("Got websocket event", msg);
      this.props.connection(msg.body.connected_users, "", USER_CONNECTION_EVT);
    };

    this.sock.onclose = (ev: CloseEvent) => {
      this.props.websocket(null);
    };
  }

  render() {
    return (
      <nav className="navbar vision-navbar" role="navigation" aria-label="main navigation">
        <div className="navbar-brand">
          <a className="navbar-item" href="https://rarebreed.github.io">
            <img src="./pngguru.png" width="120" height="120" />
          </a>

          <a role="button" className="navbar-burger burger" aria-label="menu" aria-expanded="false" data-target="navbarBasicExample">
            <span aria-hidden="true"></span>
            <span aria-hidden="true"></span>
            <span aria-hidden="true"></span>
          </a>
        </div>

        <div id="navbarBasicExample" className="navbar-menu">
          <div className="navbar-start">
            <NavBarItem item="Home" />
            { this.props.loggedIn ? <NavBarItem item="Chat" /> : null }

            <div className="navbar-item has-dropdown is-hoverable">
              <NavBarLink link="More" />

              <div className="navbar-dropdown">
                <NavBarItem item="About" />
                <NavBarItem item="Blog" href="https://rarebreed.github.io"/>
                <NavBarItem item="Chat" callback={ this.setupChat }/>
                <NavBarItem item="Webcam" callback={ this.setupWebcam }/>
                <hr className="navbar-divider" />
                <NavBarItem item="Report an issue" />
              </div>
            </div>
          </div>
          <div className="navbar-end">
            <div className="navbar-item">
              { this.isLoggedIn() }
            </div>
          </div>

          <SignUp />
          <Login />
        </div>
      </nav>
    );
  }
}

export default connector(NavBar);