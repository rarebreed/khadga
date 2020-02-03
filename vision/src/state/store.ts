import { combineReducers } from "redux";
import { modalReducer
			 , signupReducer
			 , loginReducer
			 , loginFormReducer
			 } from "./reducers";
import { ModalState
			 , SignUp
			 , LoginReducerState
			 , UserLogin
			 } from "./types";

export interface State {
	modal: ModalState,
	signup: SignUp,
	login: UserLogin,
	connectState: LoginReducerState
}

/**
 * As we add new reducers, add them as key:val pairs
 */
export const reducers = combineReducers({
	modal: modalReducer,
	signup: signupReducer,
	login: loginFormReducer,
	connectState: loginReducer
});

export default {
	reducers
};