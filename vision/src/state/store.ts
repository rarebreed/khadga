import {combineReducers} from "redux";
import {modalReducer
  , loginReducer
  , webcamReducer
  , websocketReducer
  , chatMessageReducer
  , selectedUsersReducer
  , peerConnReducer
  , videoRefReducer
  , webcommReducer
} from "./reducers";
import {ModalState
  , SignUp
  , LoginReducerState
  , UserLogin
  , WebcamState
  , WebSocketState
  , VideoRefReducerState
  , WebCommReducerState
} from "./types";
import {ChatMessageState} from "./message-types";

export interface State {
  modal: ModalState,
  signup: SignUp,
  login: UserLogin,
  connectState: LoginReducerState,
  webcam: WebcamState
  websocket: WebSocketState,
  messages: ChatMessageState[],
  selectedUsers: string[]
  peer: RTCPeerConnection,
  videoRef: VideoRefReducerState,
  webcomm: WebCommReducerState
}

/**
 * As we add new reducers, add them as key:val pairs
 */
export const reducers = combineReducers({
  modal: modalReducer,
  connectState: loginReducer,
  webcam: webcamReducer,
  websocket: websocketReducer,
  messages: chatMessageReducer,
  selectedUsers: selectedUsersReducer,
  peer: peerConnReducer,
  videoRef: videoRefReducer,
  webcomm: webcommReducer
});

export default {
  reducers
};