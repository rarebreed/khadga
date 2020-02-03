import * as React from "react";
import { connect, ConnectedProps } from "react-redux";

import { logger } from "../../logger";
import { State } from "../../state/store";
import { SignUp
			 , SET_SIGNUP_USERNAME
			 , SET_SIGNUP_PASSWORD
			 , SET_SIGNUP_EMAIL 
			 } from "../../state/types";
import { NamedField } from "./namedfield";
import { setSignUp } from "../../state/action-creators";
import { InputTypeProps } from "./namedfield";

// We only need the
const mapStateToPropsSignUp = (state: State): SignUp => {
	return Object.assign({}, state.signup);
};

// The purpose of the form is to capture what the user types in
const mapDispatchSignUp = {
	setSignUp
};

const signupConnector = connect(mapStateToPropsSignUp, mapDispatchSignUp);
type PropsFromReduxSignUp = ConnectedProps<typeof signupConnector>;
type SignupProps = PropsFromReduxSignUp & InputTypeProps;

// tslint:disable-next-line:class-name
class SignUpNamedField extends NamedField<SignupProps> {
  nameHandler = (evt: React.ChangeEvent<HTMLInputElement>) => {
		logger.log(evt.target.value);

		const nameField = this.props.name.toLowerCase();
		const action = nameField === "username" ? SET_SIGNUP_USERNAME :
								   nameField === "password" ? SET_SIGNUP_PASSWORD :
								                              SET_SIGNUP_EMAIL;

		this.props.setSignUp({
	    name: this.props.name,
	    value: evt.target.value
		}, action);
	}
}

export default signupConnector(SignUpNamedField);