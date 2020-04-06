import {combineReducers} from "redux";
import {
  modalReducer,
  loginReducer,
  webcamReducer,
  chatMessageReducer,
  selectedUsersReducer,
  peerConnReducer,
  videoRefReducer,
  remoteVideoReducer,
  mainTabReducer
} from "./reducers";
import {
  ModalState,
  LoginReducerState,
  WebcamState,
  VideoRefReducerState
} from "./types";
import {ChatMessageState} from "./message-types";

export interface State {
  modal: ModalState,
  connectState: LoginReducerState,
  webcam: WebcamState
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
  messages: chatMessageReducer,
  selectedUsers: selectedUsersReducer,
  peer: peerConnReducer,
  videoRef: videoRefReducer,
  remoteVideo: remoteVideoReducer,
  tab: mainTabReducer
});

export default {
  reducers
};