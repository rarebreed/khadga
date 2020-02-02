import React from "react";
import { AbstractModal } from "./forms/abstract-modal";
import { ModalProps, connector } from "./common-modal";

const logger = console;

/**
 * Modal that will show up when the Sign Up button is clicked
 */
class LoginModal extends AbstractModal<ModalProps> {
  constructor(props: ModalProps) {
    super(props);
    logger.debug(`In Modal Constructor: props`, props);
  }

  setActive = (_: React.MouseEvent<HTMLButtonElement>) => {
    const current = this.props.modal.login.isActive;
    logger.debug(`Clicked button: current = ${current}`);
    this.props.setActive(!current);
  }

  cancel = (_: React.MouseEvent<HTMLAnchorElement>) => {
    this.props.setActive(false);
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
        uname: this.props.signup.username,
        email: this.props.signup.email,
        psw: this.props.signup.password
      })
    };

    const origin = window.location.origin;
    const response = await fetch(`http://${origin}:7001/register`, request);
    if (response.status !== 200) {
      throw new Error(`status was ${response.status} ${response.statusText}`);
    } else {
      this.props.setActive(false);
    }
  }
}

// The call to connect returns the modified Modal class
export default connector(LoginModal);