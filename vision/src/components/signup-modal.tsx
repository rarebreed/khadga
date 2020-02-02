import React from "react";
import { AbstractModal } from "./forms/abstract-modal";
import { ModalProps, connector } from "./common-modal";

const logger = console;


class SignupModal extends AbstractModal<ModalProps> {
  constructor(props: ModalProps) {
    super(props);
    logger.debug(`In Modal Constructor: props`, props);
  }

  setActive = (_: React.MouseEvent<HTMLButtonElement>) => {
    const current = this.props.isActive;
    logger.debug(`Clicked button: current = ${current}`);
    this.props.setActive(!current);
  }

  cancel = (_: React.MouseEvent<HTMLAnchorElement>) => {
    this.props.setActive(false);
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
        psw: this.props.signup.password
      })
    };

    const origin = window.location.origin;
    const response = await fetch(`http://${origin}:7001/login`, request);
    if (response.status !== 200) {
      throw new Error(`status was ${response.status} ${response.statusText}`);
    } else {
      this.props.setActive(false);
    }
  }
}

// The call to connect returns the modified Modal class
export default connector(SignupModal);