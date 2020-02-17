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
			 , SET_SIGNUP_ACTIVE
			 , SET_LOGIN_ACTIVE
			 , SET_LOGIN_PASSWORD
			 , StateStore
			 , LoginAction
			 , LoginFormAction
			 , USER_LOGIN
			 , USER_DISCONNECT
			 , USER_TEST
			 , ChatMessage
			 , MessageAction
			 , MESSAGE_ADD
			 , MESSAGE_DELETE
			 , LoginReducerState
			 , SET_LOGIN_USERNAME
			 , SET_LOGIN_CLEAR
			 , SET_SIGNUP_CLEAR
			 , WebcamState
			 , WebcamAction
			 , WEBCAM_DISABLE
			 , WEBCAM_ENABLE
			 , WEBCAM_RESIZE
			 , USER_CONNECTION_EVT
			 , WebSocketAction
			 , WebSocketState
			 } from "./types";
import { logger } from "../logger";

const initialModalState: ModalState = {
	signup: {
		isActive: false
	},
	login: {
		isActive: false
	}
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

const initialWebcamState: WebcamState = {
	active: false,
	size: {
		height: 480,
		width: 640
	}
};

// This is the total data store of our app
export const state: StateStore = {
	modal: initialModalState,
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
	switch (action.type) {
		case SET_SIGNUP_ACTIVE:
			return {
				signup: {
					isActive: action.status
				},
				login: previous.login
			};
			break;
		case SET_LOGIN_ACTIVE:
			return {
				login: {
					isActive: action.status
				},
				signup: previous.signup
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
	// logger.debug(`Current state for signupReducer`, previous);

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
		case SET_SIGNUP_CLEAR:
			newstate.username = "";
			newstate.password = "";
			newstate.email = "";
			break;
		default:
			result = previous;
	}

	return result;
};

const defaultLoginState: LoginReducerState = {
	connected: new Set(),
	loggedIn: false
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
export const loginReducer = ( previous: LoginReducerState = defaultLoginState
	                          , action: LoginAction) => {
	const newstate = Object.assign({}, previous);

	switch (action.type) {
		case USER_LOGIN:
			newstate.connected.add(action.username);
			newstate.loggedIn = true;
			break;
		case USER_DISCONNECT:
			newstate.connected = new Set();
			newstate.loggedIn = false;
			break;
		case USER_TEST:
			newstate.loggedIn = true;
			break;
		case USER_CONNECTION_EVT:
			if (!action.connected) {
				return previous;
			} else {
				action.connected.forEach(user => {
					newstate.connected.add(user);
				});
			}
			break;
		default:
			return previous;
	}

	// const disp = (arg: any) => JSON.stringify(arg, null, 2);
  // logger.debug(`previous=${disp(previous)},\ncurrent=${disp(newstate)}`);
	return newstate;
};

/**
 * Handles state for signup form
 *
 * @param previous
 * @param action
 */
export const loginFormReducer = ( previous: UserLogin = initialUserLogin
														    , action: LoginFormAction )
														    : UserLogin => {
	const newstate = Object.assign({}, previous);

	switch (action.type) {
		case SET_LOGIN_USERNAME:
			newstate.username = action.form.value;
			break;
		case SET_LOGIN_PASSWORD:
			newstate.password = action.form.value;
			break;
		case SET_LOGIN_CLEAR:
			newstate.username = "";
			newstate.password	= "";
			break;
		default:
			return previous;
	}

	const disp = (arg: any) => JSON.stringify(arg, null, 2);
	// logger.debug(`Called with ${disp(action)}`);
	// logger.debug(`Previous=${disp(previous)}\ncurrent=${disp(newstate)}`);
	return newstate;
};

/**
 * Sets new Message components in the chat container (the middle part)
 */
export const messageReducer = ( previous: ChatMessage[] = []
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
};

export const webcamReducer = ( previous: WebcamState = initialWebcamState
	                           , action: WebcamAction) => {
	const newstate = Object.assign({}, previous);

	switch (action.type) {
		case WEBCAM_ENABLE:
			newstate.active = true;
			break;
		case WEBCAM_DISABLE:
			newstate.active = false;
			break;
		case WEBCAM_RESIZE:
			newstate.size = action.webcam.size;
			break;
		default:
			return previous;
	}

	return newstate;
};

export const websocketReducer = ( previous: WebSocketState = { socket: null }
																, action: WebSocketAction)
																: WebSocketState => {
  const sockState: WebSocketState = {
		socket: null
	};

  if (action.type === "WEBSOCKET_CLOSE") {
		logger.log("Got a WEBSOCKET_CLOSE action");
		return sockState;
	} else if (action.type === "WEBSOCKET_CREATE") {
		logger.log("Got a WEBSOCKET_CREATE action");
		logger.log(`socket is ${action.socket.socket}`);
		sockState.socket = action.socket.socket;
		return sockState;
	} else {
		logger.log(`for websocket action: ${JSON.stringify(action)}`);
		return previous;
	}
};