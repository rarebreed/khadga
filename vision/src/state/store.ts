import {combineReducers} from "redux";
import {
  modalReducer,
  loginReducer,
  webcamReducer,
  websocketReducer,
  chatMessageReducer,
  selectedUsersReducer,
  peerConnReducer,
  videoRefReducer,
  remoteVideoReducer,
  mainTabReducer
} from "./reducers";
import {
  ModalState,
  SignUp,
  LoginReducerState,
  UserLogin,
  WebcamState,
  WebSocketState,
  VideoRefReducerState
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
  remoteVideo: Map<string, MediaStream>,
  tab: string
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
  remoteVideo: remoteVideoReducer,
  mainTabs: mainTabReducer
});

export default {
  reducers
};