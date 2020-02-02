import * as React from "react";
import { connect, ConnectedProps } from "react-redux";

import { SignUp } from "./signup";
import { State } from "../state/store";
import { setActive, createLoginAction } from "../state/action-creators";
import { logger } from "../logger";
import { USER_TEST } from "../state/types";

interface INavBarItemProps {
  item: string
}

class NavBarItem extends React.Component<INavBarItemProps> {
  render() {
    return (
      <a className="navbar-item">
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
  logger.log(`in navbar mapState before: ${JSON.stringify(state, null, 2)}`);
  return {
    isActive: state.modal,
    loggedIn: state.connectState.loggedIn
  };
};

const mapDispatch = {
  signUp: setActive,
  login: createLoginAction
};

const connector = connect(mapState, mapDispatch);
type PropsFromRedux = ConnectedProps<typeof connector>;

class NavBar extends React.Component<PropsFromRedux> {
  signUpHandler = (_: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
    this.props.signUp(true);
  }

  setLogin = (_: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
    // TODO: Make call to khadga to login.  If successful call 
    this.props.login("testing", USER_TEST);
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

    return this.props.loggedIn ? null : buttons;
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
            <NavBarItem item="Documentation" />

            <div className="navbar-item has-dropdown is-hoverable">
              <NavBarLink link="More" />

              <div className="navbar-dropdown">
                <NavBarItem item="About" />
                <NavBarItem item="Jobs" />
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
        </div>
      </nav>
    );
  }
}

export default connector(NavBar);