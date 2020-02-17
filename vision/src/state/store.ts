import { combineReducers } from "redux";
import { modalReducer
			 , signupReducer
			 , loginReducer
			 , loginFormReducer
			 , webcamReducer
			 , websocketReducer
			 , chatMessageReducer
			 } from "./reducers";
import { ModalState
			 , SignUp
			 , LoginReducerState
			 , UserLogin
			 , WebcamState
			 , WebSocketState
			 , ChatMessageState
			 } from "./types";

export interface State {
	modal: ModalState,
	signup: SignUp,
	login: UserLogin,
	connectState: LoginReducerState,
	webcam: WebcamState
	websocket: WebSocketState,
	messages: ChatMessageState[]
}

/**
 * As we add new reducers, add them as key:val pairs
 */
export const reducers = combineReducers({
	modal: modalReducer,
	signup: signupReducer,
	login: loginFormReducer,
	connectState: loginReducer,
	webcam: webcamReducer,
	websocket: websocketReducer,
	messages: chatMessageReducer
});

export default {
	reducers
};