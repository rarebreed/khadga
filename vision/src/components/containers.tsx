import * as React from "react";
import * as ReactDom from "react-dom";
import { NamedField } from "./forms";
import { ClassName, IsActive } from "./common-interfaces";

interface ModalId {
  id: string
}

export class Modal extends React.Component<ClassName & ModalId, ClassName> {
  isActive: string;

  constructor(props: ClassName & ModalId) {
    super(props);

    this.isActive = "";
    this.state = {
      className: `modal ${this.isActive}`
    }
  }

  setActive = (enable: boolean) => {
    let notActive = !this.state.className.includes("is-active");
    if (enable) {
      let newState = this.state.className;
      if (notActive) {
        newState = `${newState} is-active`;
      }

      this.setState({
        className: newState
      })
    } else {
      if (!notActive) {
        this.setState({
          className: this.state.className.replace("is-active", "")
        });
      }
    }
  }

  render() {
    return (
      <div className={ this.state.className }>
        <div className="modal-background"></div>
        <div className="modal-content">
          { this.props.children }
        </div>
        <button className="modal-close is-large" aria-label="close"></button>
      </div>
    )
  }
}

export class Login extends React.Component<ModalId> {
  render() {
    return (
      <Modal id={ this.props.id } className="modal">
        <NamedField name="Name"></NamedField>
        <NamedField name="Password"></NamedField>
        <NamedField name="Email"></NamedField>
      </Modal>
    )
  }
}

export default {
  Modal,
  Login
}