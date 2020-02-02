/**
 * This module will store the various Actions and data types used in the Action
 */
export const SET_SIGNUP_ACTIVE = 'SET_SIGNUP_ACTIVE';
export const SET_LOGIN_ACTIVE = "SET_LOGIN_ACTIVE";

export const SET_SIGNUP_USERNAME = "SET_SIGNUP_USERNAME";
export const SET_SIGNUP_EMAIL = "SET_SIGNUP_EMAIL";
export const SET_SIGNUP_PASSWORD = "SET_SIGNUP_PASSWORD";
export type SET_SIGNUP = "SET_SIGNUP_USERNAME" | "SET_SIGNUP_PASSWORD" | "SET_SIGNUP_EMAIL";

export const USER_LOGIN = "USER_LOGIN";
export const USER_DISCONNECT = "USER_DISCONNECT";
export const USER_TEST = "USER_TEST";
export type LOGIN_ACTIONS = "USER_LOGIN" | "USER_DISCONNECT" | "USER_TEST";

export const MESSAGE_ADD = "MESSAGE_ADD";
export const MESSAGE_EDIT = "MESSAGE_EDIT";
export const MESSAGE_DELETE = "MESSAGE_DELETE";
export type MESSAGE_ACTIONS = "MESSAGE_ADD" | "MESSAGE_EDIT" | "MESSAGE_DELETE";

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
	username: string
}

export interface LoginReducerState {
	connected: string[],
	loggedIn: boolean
}
export interface Message {
	sender: string,
	recipient?: string,
	message: string,
	timestamp: string,
	edited?: string
}

export interface MessageAction {
	type: MESSAGE_ACTIONS,
	message: Message
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
	messages: Message[]
}