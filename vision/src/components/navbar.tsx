import * as React from "react";
import { connect, ConnectedProps } from "react-redux";

import { SignUp } from "./signup";
import { State } from "../state/store";
import { setActive
       , createLoginAction
       , setLoginForm 
       } from "../state/action-creators";
import { logger } from "../logger";
import { SET_SIGNUP_ACTIVE
       , SET_LOGIN_ACTIVE
       , USER_DISCONNECT
       , SET_LOGIN_USERNAME 
       } from "../state/types";
import  Login from "./login";
import * as noesis from "@khadga/noesis";
import { VideoStream } from "./inputs/webcam";

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
  login: createLoginAction,
  setLoginForm
};

const connector = connect(mapState, mapDispatch);
type PropsFromRedux = ConnectedProps<typeof connector>;

class NavBar extends React.Component<PropsFromRedux> {
  signUpHandler = (_: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
    this.props.signUp(true, SET_SIGNUP_ACTIVE);
  }

  setLogin = (_: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
    logger.log("In setLogin");
    this.props.signUp(true, SET_LOGIN_ACTIVE);
    // this.props.login("testing", USER_TEST);
    this.props.setLoginForm({ name: "Username", value: "this is fucked up"}, SET_LOGIN_USERNAME);
  }

  logout = (_: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
    this.props.login(this.props.user, USER_DISCONNECT);
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

  setupWebcam =(_: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
    const mediaDevs = noesis.list_media_devices();
    logger.log(JSON.stringify(mediaDevs));
    return;
  }

  render() {
    return (
      <nav className="navbar" role="navigation" aria-label="main navigation">
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