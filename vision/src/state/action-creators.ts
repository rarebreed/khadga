import { ModalAction
			 , SET_ACTIVE
			 , SignUpAction
			 , SET_SIGNUP_USERNAME
			 , SET_SIGNUP_PASSWORD
			 , SET_SIGNUP_EMAIL,
			 NamePropState,
			 SET_SIGNUP
			 } from "./types";

export const setActive = (isActive: boolean): ModalAction => {
	return {
		type: SET_ACTIVE,
		status: isActive
	};
};

export const setSignUp = (state: NamePropState<string>): SignUpAction => {
	const name = state.name.toLocaleLowerCase();

	const actionType: SET_SIGNUP = name === "username" ? SET_SIGNUP_USERNAME :
															   name === "password" ? SET_SIGNUP_PASSWORD :
															                         SET_SIGNUP_EMAIL;

	const action: SignUpAction = {
		type: actionType,
		form: state
	};

	return action;
};