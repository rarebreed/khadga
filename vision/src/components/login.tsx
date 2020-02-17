import React from "react";
import { connect, ConnectedProps } from "react-redux";

import LoginNamedField from "./forms/login-form";
import Modal from "./login-modal";
import { State } from "../state/store";

const mapStateToProps = (state: State) => {
  return {
    password: state.login.password,
    username: state.login.username
  };
};

const connector = connect(mapStateToProps);
type PropsFromRedux = ConnectedProps<typeof connector>;

class Login extends React.Component<PropsFromRedux> {
  render() {
    return (
      <Modal bulma="modal">
        <LoginNamedField name="Username" value={this.props.username} />
        <LoginNamedField
          name="Password"
          value={this.props.password}
          inputType="password" />
      </Modal>
    );
  }
}

export default connector(Login);