import { combineReducers } from "redux";
import { modalReducer
			 , signupReducer
			 , loginReducer
			 } from "./reducers";
import { ModalState, SignUp, LoginReducerState } from "./types";

export interface State {
	modal: ModalState,
	signup: SignUp,
	connectState: LoginReducerState
}

/**
 * As we add new reducers, add them as key:val pairs
 */
export const reducers = combineReducers({
	modal: modalReducer,
	signup: signupReducer,
	connectState: loginReducer
});

export default {
	reducers
};