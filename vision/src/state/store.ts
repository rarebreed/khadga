import { combineReducers } from "redux";
import { modalReducer
			 , signupReducer
			 , loginReducer
	     , state } from "./reducers";

/**
 * As we add new reducers, add them as key:val pairs
 */
export const reducers = combineReducers({
	modal: modalReducer,
	signup: signupReducer,
	connectedUsers: loginReducer
});

export default {
	state, reducers
};