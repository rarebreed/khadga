import React from "react";
import { AbstractModal } from "./forms/abstract-modal";
import { ModalProps, connector } from "./common-modal";
import { SET_SIGNUP_ACTIVE } from "../state/types";

const logger = console;


class SignupModal extends AbstractModal<ModalProps> {
  constructor(props: ModalProps) {
    super(props);
    logger.debug(`In Modal Constructor: props`, props);
  }

  setActive = (_: React.MouseEvent<HTMLButtonElement>) => {
    const current = this.props.modal.signup;
    logger.debug(`Clicked button: current = ${current}`);
    this.props.setActive(!current, SET_SIGNUP_ACTIVE);
  }

  cancel = (_: React.MouseEvent<HTMLAnchorElement>) => {
    this.props.setActive(false, SET_SIGNUP_ACTIVE);
  }

  getActive = () => {
    return this.props.modal.signup.isActive;
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
        uname: this.props.signup.username,
        psw: this.props.signup.password,
        email: this.props.signup.email
      })
    };

    const origin = window.location.origin;
    const response = await fetch(`${origin}/register`, request);
    
    if (response.status !== 200) {
      const err = `status was ${response.status} ${response.statusText}`;
      logger.error(err);
      throw new Error(err);
    } else {
      this.props.setActive(false, SET_SIGNUP_ACTIVE);
    }
  }
}

// The call to connect returns the modified Modal class
export default connector(SignupModal);