/**
 * Reducers for our UI and models
 */
import { ModalState
			 , ModalAction
			 , NamePropState
			 , SignUp
			 , UserLogin
			 , SignUpAction
			 , SET_SIGNUP_EMAIL
			 , SET_SIGNUP_PASSWORD
			 , SET_SIGNUP_USERNAME
			 , SET_ACTIVE, 
			 StateStore} from "./types";
import { logger } from "../logger";

const initialModalState = {
	isActive: false
};

const initialShowLoginState = {
	isActive: false
};

const initialSignupState: SignUp = {
	username: "Eg. johndoe",
	password: "",
	email: "Eg. joe.shmoe@gmail.com"
};

const initialUserLogin: UserLogin ={
	username: "",
	password: ""
};

// This is the total data store of our app
export const state: StateStore = {
	modal: initialModalState,
	showLogin: initialShowLoginState, // Whether to show the Login modal or not
	signup: initialSignupState,
	login: initialUserLogin,
	loggedIn: false,     // If user has logged in (don't show Login or Signup button)
	connectedUsers: []
};

export const modalReducer = ( previous: ModalState = initialModalState
														, action: ModalAction)
														: ModalState => {
	logger.debug(`Current state for modalReducer:`, previous);
	switch (action.type) {
		case SET_ACTIVE:
			logger.log(`action.status = ${action.status}`);
			return {
				isActive: action.status
			};
			break;
		default:
			return previous;
	}
};

/**
 * Handles state for signupform
 *
 * @param previous
 * @param action
 */
export const signupReducer = ( previous: SignUp = initialSignupState
														 , action: SignUpAction )
														 : SignUp => {
	logger.debug(`Current state for signupReducer`, previous);

	// FIXME: Technically we should only do this except on default case
	const newstate = Object.assign({}, previous);
	let result: SignUp = newstate;

	switch (action.type) {
		case SET_SIGNUP_USERNAME:
			newstate.username = action.form.value;
			break;
		case SET_SIGNUP_EMAIL:
			newstate.email = action.form.value;
			break;
		case SET_SIGNUP_PASSWORD:
			newstate.password = action.form.value;
			break;
		default:
			result = previous;
	}

	return result;
};