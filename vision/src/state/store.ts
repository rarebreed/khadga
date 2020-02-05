import { combineReducers } from "redux";
import { modalReducer
			 , signupReducer
			 , loginReducer
			 , loginFormReducer
			 , webcamReducer
			 } from "./reducers";
import { ModalState
			 , SignUp
			 , LoginReducerState
			 , UserLogin
			 , WebcamState
			 } from "./types";

export interface State {
	modal: ModalState,
	signup: SignUp,
	login: UserLogin,
	connectState: LoginReducerState,
	webcam: WebcamState
}

/**
 * As we add new reducers, add them as key:val pairs
 */
export const reducers = combineReducers({
	modal: modalReducer,
	signup: signupReducer,
	login: loginFormReducer,
	connectState: loginReducer,
	webcam: webcamReducer
});

export default {
	reducers
};