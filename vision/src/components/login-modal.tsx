import React from "react";
import { connect, ConnectedProps } from "react-redux";

import { AbstractModal } from "./forms/abstract-modal";
import { mapDispatch } from "./common-modal";
import { SET_LOGIN_ACTIVE, USER_LOGIN, SET_LOGIN_CLEAR } from "../state/types";
import { createLoginAction, setLoginForm } from "../state/action-creators";
import { State } from "../state/store";

const logger = console;

// mapState returns only what is needed from the store to this component
export const mapState = (state: State) => {
  const newstate = Object.assign({}, state.modal);
  const userLoginState = Object.assign({}, state.login);

  const combined = {
    modal: newstate,
    userLoginState
  };

  return combined;
};

const mapDispatchLogin = {
  login: createLoginAction,
  setActive: mapDispatch.setActive,
  setLoginForm
};

const connector = connect(mapState, mapDispatchLogin);
type PropsFromRedux = ConnectedProps<typeof connector>;

export type ModalProps = PropsFromRedux & {
  children?: React.ReactNode,
  bulma: string
};
/**
 * Modal that will show up when the Sign Up button is clicked
 */
class LoginModal extends AbstractModal<ModalProps> {
  setActive = (_: React.MouseEvent<HTMLButtonElement>) => {
    const current = this.props.modal.login.isActive;
    logger.debug(`Clicked button: current = ${current}`);
    this.props.setActive(!current, SET_LOGIN_ACTIVE);
  }

  cancel = (_: React.MouseEvent<HTMLAnchorElement>) => {
    this.props.setActive(false, SET_LOGIN_ACTIVE);
    this.props.setLoginForm({ name: "", value: ""}, SET_LOGIN_CLEAR);
  }

  getActive = () => {
    return this.props.modal.login.isActive;
  }

  submit = async (_: React.MouseEvent<HTMLAnchorElement>) => {
    const request: RequestInit = {
      method: 'POST',
      mode: 'cors',
      cache: 'no-cache',
      credentials: 'same-origin',
      headers: {
        "Content-Type": "application/json"
      },
      redirect: 'follow',
      body: JSON.stringify({
        uname: this.props.userLoginState.username,
        psw: this.props.userLoginState.password
      })
    };

    const origin = window.location.origin;
    const response = await fetch(`${origin}/login`, request);
    if (response.status !== 200) {
      this.props.setLoginForm({ name: "", value: ""}, SET_LOGIN_CLEAR);
      throw new Error(`status was ${response.status} ${response.statusText}`);
    } else {
      // TODO: The login endpoint will eventually return a JWT, so we need to store in our state
      // with a timestamp. We can then reuse the JWT
      // TODO: Once login is complete, we need to enable Chat in the toolbar.
      this.props.setActive(false, SET_LOGIN_ACTIVE);
      this.props.login(this.props.userLoginState.username, USER_LOGIN);
    }
  }
}

// The call to connect returns the modified Modal class
export default connector(LoginModal);