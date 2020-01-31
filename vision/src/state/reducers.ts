/**
 * Reducers for our UI and models
 */
import { ModalState
			 , ModalAction
			 , SignUp
			 , UserLogin
			 , SignUpAction
			 , SET_SIGNUP_EMAIL
			 , SET_SIGNUP_PASSWORD
			 , SET_SIGNUP_USERNAME
			 , SET_ACTIVE
			 , StateStore
			 , LoginAction
			 , USER_LOGIN
			 , USER_DISCONNECT
			 , Message
			 , MessageAction
			 , MESSAGE_ADD
			 , MESSAGE_DELETE
			 } from "./types";
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
	connectedUsers: [],
	messages: []
};

/**
 * This is called when the modal for the Login or SignUp is called
 *
 * @param previous
 * @param action
 */
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
 * Handles state for signup form
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

/**
 * Sets state for connected users
 *
 * When login is successful, this will be called with type of USER_LOGIN.  When a user disconnects
 * or logs out, type of USER_DISCONNECTED will be sent.
 *
 * @param previous
 * @param action
 */
export const loginReducer = ( previous: string[] = []
	                          , action: LoginAction) => {
	switch (action.type) {
		case USER_LOGIN:
			previous.push(action.username);
			break;
		case USER_DISCONNECT:
			previous = previous.filter(name => name !== action.username);
			break;
		default:
			logger.log("Using previous");
	}
	return previous;
};

/**
 * Sets new Message components in the chat container (the middle part)
 */
export const messageReducer = ( previous: Message[] = []
	                            , action: MessageAction) => {
	let newstate = Array.from(previous);

	switch (action.type) {
		case MESSAGE_ADD:
			newstate.push(action.message);
			break;
		case MESSAGE_DELETE:
			newstate = newstate.filter(msg => {
				if (action.message.recipient !== msg.recipient &&
						action.message.sender !== msg.sender &&
						action.message.timestamp !== msg.timestamp) {
				  return msg;
				}
			});
			break;
		default:
			return previous;
	}
	return newstate;
}