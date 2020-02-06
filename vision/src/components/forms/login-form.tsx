import * as React from "react";
import { connect, ConnectedProps } from "react-redux";

import { State } from "../../state/store";
import { UserLogin
			 , SET_LOGIN_FORM
			 , SET_LOGIN_USERNAME
			 , SET_LOGIN_PASSWORD
			 } from "../../state/types";
import { NamedField } from "./namedfield";
import { setLoginForm } from "../../state/action-creators";
import { InputTypeProps } from "./namedfield";

const logger = console;

// We only need the Login part of the state
const mapStateToPropsLogin = (state: State): UserLogin => {
	return state.login;
};

// As the user types in, we will call setLoginForm which is our action creator
const mapDispatchLogin = {
	setLoginForm
};

const loginConnector = connect(mapStateToPropsLogin, mapDispatchLogin);
type PropsFromReduxLogin = ConnectedProps<typeof loginConnector>;
type SignupProps = PropsFromReduxLogin & InputTypeProps;

class LoginNamedField extends React.Component<SignupProps> {
  nameHandler = (evt: React.ChangeEvent<HTMLInputElement>) => {
		logger.log(evt.target);
		const name = this.props.name.toLocaleLowerCase();
		const actionType: SET_LOGIN_FORM = name === "username" ? SET_LOGIN_USERNAME
																													 : SET_LOGIN_PASSWORD;

	  const action = {
	    name: this.props.name,
	    value: evt.target.value
		};
		logger.log(`in nameHandler, sending ${JSON.stringify(action, null, 2)}`);
		this.props.setLoginForm(action, actionType);
	}

	render() {
		logger.log(`In LoginNamedField: ${JSON.stringify(this.props, null, 2)}`);
		logger.log(`placeholder should equal ${this.props.value}`);
		return (
			<div className="field">
				<label className="label has-text-light">
					{ this.props.name }
				</label>
				<div className="control">
					<input className="input"
								 type={ this.props.inputType || "text" }
								 value={ this.props.value }
								 onChange={ this.nameHandler }
					       />
				</div>
			</div>
		);
	}
}

export default loginConnector(LoginNamedField);