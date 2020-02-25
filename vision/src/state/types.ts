/**
 * This module will store the various Actions and data types used in the Action
 */
import { MessageEvent } from "./message-types";

export const SET_SIGNUP_ACTIVE = "SET_SIGNUP_ACTIVE";
export const SET_LOGIN_ACTIVE = "SET_LOGIN_ACTIVE";
export type SET_MODAL_ACTIVE = "SET_SIGNUP_ACTIVE" | "SET_LOGIN_ACTIVE";

export const SET_SIGNUP_USERNAME = "SET_SIGNUP_USERNAME";
export const SET_SIGNUP_EMAIL = "SET_SIGNUP_EMAIL";
export const SET_SIGNUP_PASSWORD = "SET_SIGNUP_PASSWORD";
export const SET_SIGNUP_CLEAR = "SET_SIGNUP_CLEAR";
export type SET_SIGNUP = "SET_SIGNUP_USERNAME"
											 | "SET_SIGNUP_PASSWORD"
											 | "SET_SIGNUP_EMAIL"
											 | "SET_SIGNUP_CLEAR";

export const SET_LOGIN_USERNAME = "SET_LOGIN_USERNAME";
export const SET_LOGIN_PASSWORD = "SET_LOGIN_PASSWORD";
export const SET_LOGIN_CLEAR = "SET_LOGIN_CLEAR";
export type SET_LOGIN_FORM = "SET_LOGIN_USERNAME" | "SET_LOGIN_PASSWORD" | "SET_LOGIN_CLEAR";

export const MESSAGE_ADD = "MESSAGE_ADD";
export const MESSAGE_EDIT = "MESSAGE_EDIT";
export const MESSAGE_DELETE = "MESSAGE_DELETE";
export type MESSAGE_ACTIONS = "MESSAGE_ADD" | "MESSAGE_EDIT" | "MESSAGE_DELETE";

export const WEBCAM_ENABLE = "WEBCAM_ENABLE";
export const WEBCAM_DISABLE = "WEBCAM_DISABLE";
export const WEBCAM_RESIZE = "WEBCAM_RESIZE";
export type WEBCAM_ACTIONS = "WEBCAM_ENABLE" | "WEBCAM_DISABLE" | "WEBCAM_RESIZE";

export const WEBSOCKET_CREATE = "WEBSOCKET_CREATE";
export const WEBSOCKET_CLOSE = "WEBSOCKET_CLOSE";
export type WEBSOCKET_ACTIONS = "WEBSOCKET_CREATE" | "WEBSOCKET_CLOSE";

export const USER_LOGIN = "USER_LOGIN";
export const USER_LOGOUT = "USER_DISCONNECT";
export const USER_TEST = "USER_TEST";
export const USER_CONNECTION_EVT = "USER_CONNECTION_EVT";
export const AUTH_CREATED = "AUTH_CREATED";
export const AUTH_EXPIRED = "AUTH_EXPIRED";
export type LOGIN_ACTIONS = "USER_LOGIN"
													| "USER_DISCONNECT"
													| "USER_TEST"
													| "USER_CONNECTION_EVT"
													| "AUTH_CREATED"
													| "AUTH_EXPIRED";

export interface ActiveState {
	isActive: boolean
}

export interface ModalState {
	signup: ActiveState,
	login: ActiveState
}

export interface ModalAction {
	type: "SET_SIGNUP_ACTIVE" | "SET_LOGIN_ACTIVE"
	status: boolean
}

export interface NamePropState<T> {
	name: string,  // Identifier of a field (eg "Username" or "Password")
	value: T       // Value of the form field (eg "johndoe" or "%$^ju!9KL")
}

export const makeNamePropState = <T>(name: string, value: T): NamePropState<T> => {
	return {
		name,
		value
	};
};

/**
 * Action for when the username state changes
 */
export interface SignUpAction {
	type: SET_SIGNUP
	form: NamePropState<string>
}

export interface UserLogin {              // Data from the Signup modal
	username: string,
	password: string
}

export type SignUp = UserLogin & {
	email: string
};


export interface LoginAction {
	type: LOGIN_ACTIONS,
	username: string,
	connected?: string[],
	auth2: any | null
}

export interface LoginFormAction {
	type: SET_LOGIN_FORM,
	form: NamePropState<string>
}

export interface Connected {
	connected: string[]
}

export interface LoginReducerState {
	connected: string[],
	loggedIn: boolean,
	username: string,
	auth2: any | null
}

export const makeLoginArgs = ( props: LoginReducerState)
														 : [string[], string, any] => {
	const { connected, username, auth2 } = props;
	return [connected, username, auth2];
};

export interface ChatMessage {
	sender: string,
	recipient?: string,
	message: string,
	timestamp: string,
	edited?: string
}

export interface MessageAction {
	type: MESSAGE_ACTIONS,
	message: ChatMessage
}

export interface WebcamState {
	active: boolean,
	size?: {
		height: number,
		width: number
	}
}

export interface WebcamAction {
	type: WEBCAM_ACTIONS,
	webcam: WebcamState
}

/// This is the typescript equivalent of the message::MessageEvent from rust

export interface WebSocketState {
	socket: WebSocket | null
}

/**
 * Action for what happens to a websocket
 */
export interface WebSocketAction {
	type: WEBSOCKET_ACTIONS,
	socket: WebSocketState
}
export interface AuthState {
	auth2: any | null
}

export interface AuthAction {
	type: LOGIN_ACTIONS,
	auth2: AuthState
}

/**
 * This is the final data store for redux.
 */
export interface StateStore {
	modal: ModalState,  // Whether we show the signup modal or not
	signup: SignUp,
	login: UserLogin,
	loggedIn: boolean,     // If user has logged in (don't show Login or Signup button)
	connectedUsers: string[],
	messages: ChatMessage[]
}