import * as React from "react";
import { connect, ConnectedProps } from "react-redux";

import { Login } from "./login";
import store from "../state/store";
import { setActive } from "../state/action-creators";
import { logger } from "../logger";

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
const mapState = (state: typeof store.state) => {
  logger.log(`in navbar mapState before: ${JSON.stringify(state, null, 2)}`);
  const newstate = Object.assign({}, state);
  logger.log(`in navbar mapState after: ${JSON.stringify(newstate, null, 2)}`);

  return newstate.modal;
};

const mapDispatch = {
  signUp: setActive
};

const connector = connect(mapState, mapDispatch);
type PropsFromRedux = ConnectedProps<typeof connector>;

class NavBar extends React.Component<PropsFromRedux> {
  signUpHandler = (evt: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
    logger.log(evt);

    // TODO:  Need to use redux here and set the state of the Login modal's classname
    // or maybe use a Ref
    this.props.signUp(true);
  }

  render() {
    return (
      <nav className="navbar" role="navigation" aria-label="main navigation">
        <div className="navbar-brand">
          <a className="navbar-item" href="https://bulma.io">
            <img src="https://bulma.io/images/bulma-logo.png" width="112" height="28" />
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
              <div className="buttons">
                <a className="button is-primary" onClick={ this.signUpHandler }>
                  <strong>Sign up</strong>
                </a>
                <a className="button is-light">
                  Log in
                </a>
              </div>
            </div>
          </div>

          <Login />
        </div>
      </nav>
    );
  }
}

export default connector(NavBar);