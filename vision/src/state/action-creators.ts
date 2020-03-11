import { ModalAction
			 , SET_MODAL_ACTIVE
			 , SignUpAction
			 , LoginFormAction
			 , LOGIN_ACTIONS
			 , LoginAction
			 , WebSocketAction
			 , NamePropState
			 , SET_SIGNUP
			 , SET_LOGIN_FORM
			 , WebcamAction
			 , WebcamState
			 , WEBCAM_ACTIONS
			 , SELECT_USERS_ACTION
			 , SelectUsersAction
			 , PEER_CONNECTION_ACTIONS,
			 PeerConnAction
			 } from "./types";
import { ChatMessageState, CHAT_MESSAGE_ACTIONS} from "./message-types";

export const setActive = (isActive: boolean, action: SET_MODAL_ACTIVE): ModalAction => {
	return {
		type: action,
		status: isActive
	};
};

export const setSignUp = (state: NamePropState<string>, type: SET_SIGNUP): SignUpAction => {
	const action: SignUpAction = {
		type,
		form: state
	};

	return action;
};

export const setLoginFormAction = ( state: NamePropState<string>
														      , type: SET_LOGIN_FORM)
														      : LoginFormAction => {
	const action: LoginFormAction = {
		type,
		form: state
	};

	return action;
};

export const createLoginAction = ( connected: string[]
																 , uname: string
																 , auth2: any | null
																 , action: LOGIN_ACTIONS): LoginAction => {
	return {
		type: action,
		username: uname,
		connected,
		auth2
	};
};

export const webcamCamAction = (state: WebcamState, action: WEBCAM_ACTIONS): WebcamAction => {
	return {
		type: action,
		webcam: state
	};
};

/**
 * Action creator for Websockets
 *
 * If called with WEBSOCKET
 * @param ws
 * @param action
 */
export const websocketAction = ( ws: WebSocket | any | null)
															 : WebSocketAction => {
	return {
		type: ws !== null ? "WEBSOCKET_CREATE" : "WEBSOCKET_CLOSE",
		socket: {
			socket: ws
		}
	};
};

export const chatMessageAction = (message: ChatMessageState, action: CHAT_MESSAGE_ACTIONS) => {
	return {
		type: action,
		message
	};
};

export const selectUserAction = (user: string, action: SELECT_USERS_ACTION): SelectUsersAction => {
	return {
		type: action,
		user
	};
};

export const peerConnAction = ( peer: RTCPeerConnection | null
															, action: PEER_CONNECTION_ACTIONS)
															: PeerConnAction => {
	return {
		type: action,
		peer
	};
};