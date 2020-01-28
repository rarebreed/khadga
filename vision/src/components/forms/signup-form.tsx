import * as React from "react";
import { connect, ConnectedProps } from "react-redux";

import { logger } from "../../logger";
import { NamePropState } from "../../state/types";
import store from "../../state/store";
import { SignUp } from "../../state/types";
import { NamedField } from "./namedfield";
import { setSignUp } from "../../state/action-creators";

// We only need the
const mapStateToPropsSignUp = (state: typeof store.state): SignUp => {
	return Object.assign({}, state.signup);
};

const mapDispatchSignUp = {
	setSignUp
};

const signupConnector = connect(mapStateToPropsSignUp, mapDispatchSignUp);
type PropsFromReduxSignUp = ConnectedProps<typeof signupConnector>;
type SignupProps = PropsFromReduxSignUp & NamePropState<string>;

// tslint:disable-next-line:class-name
class SignUpNamedField extends NamedField<SignupProps> {
	nameHandler = (evt: React.ChangeEvent<HTMLInputElement>) => {
		logger.log(evt.target.value);

		this.props.setSignUp({
	    name: this.props.name,
	    value: evt.target.value
		});
	}
}

export default signupConnector(SignUpNamedField);