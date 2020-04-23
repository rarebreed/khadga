import * as React from "react";
import * as ReactDom from "react-dom";
import { Provider } from "react-redux";
import { createStore, StoreEnhancer } from "redux";

import { reducers } from "./state/store";
import NavBar from "./components/navbar";
import SideBar from "./components/sidebar-left";
import MainInput from "./components/main-input";
// import ChatContainer from "./components/chat/chat-container";
import { SideBarRight} from "./components/sidebar-right";
import { TabNav } from "./components/tabnav";
import { WebComm, WSSetup } from "./state/communication";
import { 
  webcamCamAction,
  remoteVideoAction,
  createLoginAction,
  chatMessageAction
} from "./state/action-creators";
import { LOGIN_ACTIONS } from "./state/types";
import { ChatMessageState, CHAT_MESSAGE_ACTIONS } from "./state/message-types";

type WindowWithDevTools = Window & {
  __REDUX_DEVTOOLS_EXTENSION__: () => StoreEnhancer<unknown, {}>
 };

const isReduxDevtoolsExtenstionExist = (
  arg: Window | WindowWithDevTools
): arg is WindowWithDevTools  => {
  return  "__REDUX_DEVTOOLS_EXTENSION__" in arg;
};

const foo = isReduxDevtoolsExtenstionExist(window) ?
  window.__REDUX_DEVTOOLS_EXTENSION__() : undefined;
const store = createStore(reducers, foo);
type StoreType = typeof store;

class App extends React.Component<{}> {
  webcomm: WebComm;

  constructor(props: {}) {
    super(props);

    // Create and initialize our WebComm object
    this.webcomm = new WebComm(
      webcamCamAction,
      remoteVideoAction,
      //store
    );
    const wssetup: WSSetup = {
      auth: null,
      loginAction: (
        connected: string[],
        uname: string,
        auth: any,
        action_type: LOGIN_ACTIONS
      ) => {
        const action = createLoginAction(connected, uname, auth, action_type);
        return store.dispatch(action)
      },
      chatAction: (
        message: ChatMessageState,
        actionType: CHAT_MESSAGE_ACTIONS
      ) => {
        const action = chatMessageAction(message, actionType);
        return store.dispatch(action)
      },
    };
    this.webcomm.socketSetup(wssetup);
  }

  render() {
    return (
      <div className="app">
        <NavBar webcomm={ this.webcomm } />
        <SideBar webcomm={ this.webcomm }/>
        <TabNav className="main-body" webcomm={ this.webcomm }/>
        <MainInput webcomm={ this.webcomm }/>
        <SideBarRight />
      </div>
    );
  }
}

ReactDom.render(
  <Provider store={store}>
    <App />
  </Provider>
  , document.querySelector("#app")
);