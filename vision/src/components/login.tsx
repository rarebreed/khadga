import React from "react";

import { NamedField } from "./forms";
import Modal from "./modal";

export class Login extends React.Component {
  render() {
    return (
      <Modal bulma="modal">
        <NamedField name="Name"></NamedField>
        <NamedField name="Password"></NamedField>
        <NamedField name="Email"></NamedField>
      </Modal>
    );
  }
}