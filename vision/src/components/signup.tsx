import React from "react";

import SignUpNamedField from "./forms/signup-form";
import Modal from "./modal";

export class SignUp extends React.Component {
  render() {
    return (
      <Modal bulma="modal">
        <SignUpNamedField name="Username" value="eg. johndoe"></SignUpNamedField>
        <SignUpNamedField name="Password" value="*********" inputType="password"></SignUpNamedField>
        <SignUpNamedField name="Email" value="eg. johndoe@gmail.com"></SignUpNamedField>
      </Modal>
    );
  }
}