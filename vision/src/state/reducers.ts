/**
 * Reducers for our UI and models
 */
import {
  ModalState
  , ModalAction
  , SignUp
  , UserLogin
  , SignUpAction
  , SET_SIGNUP_EMAIL
  , SET_SIGNUP_PASSWORD
  , SET_SIGNUP_USERNAME
  , SET_SIGNUP_ACTIVE
  , SET_LOGIN_ACTIVE
  , StateStore
  , LoginAction
  , USER_LOGIN
  , USER_LOGOUT
  , ChatMessage
  , MessageAction
  , MESSAGE_ADD
  , MESSAGE_DELETE
  , LoginReducerState
  , SET_SIGNUP_CLEAR
  , WebcamState
  , WebcamAction
  , WEBCAM_DISABLE
  , WEBCAM_ENABLE
  , WEBCAM_RESIZE
  , USER_CONNECTION_EVT
  , WebSocketAction
  , WebSocketState
  , AUTH_CREATED
  , AUTH_EXPIRED
  , WEBSOCKET_CLOSE
  , WEBSOCKET_CREATE
  , SelectUsersAction
  , PeerConnState
  , PeerConnAction
  , VideoRefReducerState
  , VideoRefAction
  , WebCommReducerState
  , WebCommAction
  , VideoReducerAction
} from "./types";
import {ChatMessageState
  , ChatMessageAction
  , CHAT_MESSAGE_DELETE
  , CHAT_MESSAGE_ADD
  , CHAT_MESSAGE_EDIT
  , CHAT_MESSAGE_REPLY
} from "./message-types";
import {logger} from "../logger";
import {WebComm} from "../components/webrtc/communication";

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
  connected: [],
  loggedIn: false,
  username: "",
  auth2: null
};

// Makes sure if we have a duplicate user in conn, that it will get a unique name
const latestName = (conn: string[], user: string) => {
  let baseName = user;
  const re = new RegExp(`${baseName}-(\\d+)`);
  let index = 0;
  for (const name of conn) {
    if (name === baseName) {
      logger.log(`${name} in list matches current of ${baseName}`);
      const matched = name.match(re);
      if (matched) {
        index = parseInt(matched[1], 10) + 1;
        logger.log(matched);
        logger.log(`Got match, index is ${index}`);
        baseName = baseName.replace(/\d+/, `${index}`);
      } else {
        index += 1;
        baseName = `${baseName}-${index}`;
      }
    } else {
      logger.log(`${name} does not equal ${baseName}`);
    }
    logger.log(`baseName is now ${baseName}`);
  }
  return baseName;
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
export const loginReducer = (
  previous: LoginReducerState = defaultLoginState,
  action: LoginAction
) => {
  const newstate = Object.assign({}, previous);

  switch (action.type) {
  case USER_LOGIN:  // Comes from front end
    if (action.username === "") {
      logger.error("action.username was empty");
      return previous;
    }
    // the connected field is only for when the Chat button is clicked
    // newstate.connected.push(action.username);
    newstate.loggedIn = true;
    newstate.username = action.username;
    break;
  case USER_LOGOUT:  // Comes from front end
    newstate.connected = [];
    newstate.loggedIn = false;
    newstate.username = "";
    break;
  case USER_CONNECTION_EVT:  // Come from the server
    if (!action.connected || action.connected.length === 0) {
      logger.log("Empty action.connected", action.connected);
      return previous;
    } else if (!previous.loggedIn) {
      logger.log("User not logged in yet, ignoring connection event");
      return previous;
    } else {
      // Only connect users who aren't already connected
      newstate.connected = action.connected || [];
      logger.log("Using action.connected", newstate.connected);
    }
    logger.log("newstate.connected now ", newstate.connected);
    break;
  case AUTH_CREATED:
    newstate.auth2 = action.auth2;
    break;
  case AUTH_EXPIRED:
    if (action.auth2 !== null) {
      logger.error("The action was set to AUTH_EXPIRED, but action.auth2 is not null");
    }
    newstate.auth2 = action.auth2;
    break;
  default:
    return previous;
  }

  // const disp = (arg: any) => JSON.stringify(arg, null, 2);
  // logger.debug(`previous=${disp(previous)},\ncurrent=${disp(newstate)}`);
  return newstate;
};


/**
 * Sets new Message components in the chat container (the middle part)
 */
export const messageReducer = ( 
  previous: ChatMessage[] = [],
  action: MessageAction
) => {
  let newstate = Array.from(previous);

  switch (action.type) {
  case MESSAGE_ADD:
    newstate.push(action.message);
    break;
  case MESSAGE_DELETE:
    newstate = newstate.filter((msg) => {
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

export const webcamReducer = ( 
  previous: WebcamState = initialWebcamState,
  action: WebcamAction
) => {
  const newstate = Object.assign({}, previous);

  switch (action.type) {
  case WEBCAM_ENABLE:
    newstate.active = true;
    if (action.webcam.videoId) {
      newstate.videoId = action.webcam.videoId;
    }
    if (action.webcam.target) {
      newstate.target = action.webcam.target
    }
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

export const websocketReducer = ( 
  previous: WebSocketState = {socket: null},
  action: WebSocketAction
): WebSocketState => {
  const sockState: WebSocketState = {
    socket: null
  };

  switch(action.type) {
  case WEBSOCKET_CLOSE:
    logger.log("Got a WEBSOCKET_CLOSE action");
    return sockState;
  case WEBSOCKET_CREATE:
    logger.log("Got a WEBSOCKET_CREATE action");
    logger.log(`socket is ${action.socket.socket}`);
    sockState.socket = action.socket.socket;
    return sockState;
  default:
    return previous;
  }
};

export const chatMessageReducer = ( 
  previous: ChatMessageState[] = [],
  action: ChatMessageAction
) => {
  switch(action.type) {
  case CHAT_MESSAGE_ADD:
    const newstate = Object.assign([], previous);
    newstate.push(action.message);
    return newstate;
  case CHAT_MESSAGE_DELETE:
    logger.error("Needs to be implemented");
    break;
  case CHAT_MESSAGE_EDIT:
    logger.error("Needs to be implemented");
    break;
  case CHAT_MESSAGE_REPLY:
    logger.error("Needs to be implemented");
    break;
  default:
    return previous;
  }
};

export const selectedUsersReducer = ( 
  previous: string[] = [],
  action: SelectUsersAction
) => {
  switch(action.type) {
  case "ADD_USER":
    const newState = Array.from(previous);
    newState.push(action.user);
    return newState;
  case "REMOVE_USER":
    return previous.filter(name => name !== action.user);
  case "CLEAR_ALL":
    return [];
  default:
    return previous;
  }
};

const defaultPeerConnState: PeerConnState = {
  peer: null
};

/**
 * FIXME: Remove this in place of the webcommReducer
 * 
 * @param previous 
 * @param action 
 */
export const peerConnReducer = ( previous: PeerConnState = defaultPeerConnState
  , action: PeerConnAction) => {
  switch(action.type) {
  case "SET_PEER_CONNECTION":
    if (action.peer === null) {
      logger.error("Can not have null peer object when setting");
      return previous;
    }
    return {
      peer: action.peer
    };
  case "REMOVE_PEER_CONNECTION":
    return {
      peer: null
    };
  default:
    return previous;
  }
};

const initialVideoRefState: VideoRefReducerState = {
  videoRefId: null
};

export const videoRefReducer = ( previous: VideoRefReducerState = initialVideoRefState
  , action: VideoRefAction) => {
  switch(action.type) {
  case "SET_VIDEO_REF":
    if (action.ref === null) {
      logger.error("Trying to set videoRefId with a null action.ref");
      return previous;
    }
    return action.ref;
  case "REMOVE_VIDEO_REF":
    return {
      videoRefId: null
    };
  default:
    return previous;
  }
};


const InitialWebCommState: WebCommReducerState = {
  webcomm: null
};

export const webcommReducer = (
  previous: WebCommReducerState = InitialWebCommState,
  action: WebCommAction
) => {
  switch(action.type) {
  case "CREATE_WEBCOMM":
    if (!action.data) {
      logger.warn("No WebComm object supplied.   Returning previous");
      return previous;
    }
    return {
      webcomm: action.data
    };
  case "DELETE_WEBCOMM":
    return {
      webcomm: null
    };
  default:
    return previous;
  }
};

export const remoteVideoReducer = (
  previous: Map<string, MediaStream> = new Map(),
  action: VideoReducerAction
) => {
  switch (action.type) {
    case "REMOTE_EVENT":
      return action.data
    default:
      return previous;
  }
}

"For"