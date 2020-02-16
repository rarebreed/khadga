import { ModalAction
			 , SET_MODAL_ACTIVE
			 , SignUpAction
			 , LoginFormAction
			 , LOGIN_ACTIONS
			 , LoginAction
			 , Connected
			 , NamePropState
			 , SET_SIGNUP
			 , SET_LOGIN_FORM
			 , WebcamAction
			 , WebcamState
			 , WEBCAM_ACTIONS
			 } from "./types";

export const setActive = (isActive: boolean, action: SET_MODAL_ACTIVE): ModalAction => {
	return {
		type: action,
		status: isActive
	};
};

export const setSignUp = (state: NamePropState<string>, type: SET_SIGNUP): SignUpAction => {
	const action: SignUpAction = {
		type,
		form: state
	};

	return action;
};

export const setLoginFormAction = ( state: NamePropState<string>
														      , type: SET_LOGIN_FORM)
														      : LoginFormAction => {
	const action: LoginFormAction = {
		type,
		form: state
	};

	return action;
};

export const createLoginAction = ( connected: Set<string>
																 , uname: string
																 , action: LOGIN_ACTIONS): LoginAction => {
	return {
		type: action,
		username: uname,
		connected
	};
};

export const webcamCamAction = (state: WebcamState, action: WEBCAM_ACTIONS): WebcamAction => {
	return {
		type: action,
		webcam: state
	};
};