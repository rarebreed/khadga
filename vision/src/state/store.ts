import { combineReducers } from "redux";
import { modalReducer
	     , signupReducer
	     , state } from "./reducers";

/**
 * As we add new reducers, add them as key:val pairs
 */
export const reducers = combineReducers({
	modal: modalReducer,
	signup: signupReducer
});

export default {
	state, reducers
};