
import * as React from "react";
import * as ReactDom from "react-dom";
import { Provider } from "react-redux";
import {createStore, StoreEnhancer} from "redux";

import { reducers } from "./state/store";
import NavBar from "./components/navbar";
import SideBar from "./components/sidebar-left";
import ChatInput from "./components/chat/chat-input";
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
import { Subject } from "rxjs";

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
const store = createStore( reducers, foo);

class App extends React.Component<{}> {
  webcomm: WebComm;

  constructor(props: {}) {
    super(props);

    // Create and initialize our WebComm object
    this.webcomm = new WebComm(
      webcamCamAction,
      remoteVideoAction
    );
    const wssetup: WSSetup = {
      auth: null,
      loginAction: createLoginAction,
      chatAction: chatMessageAction,
    };
    this.webcomm.socketSetup(wssetup);
  }

  render() {
    return (
      <div className="app">
        <NavBar webcomm={ this.webcomm } />
        <SideBar webcomm={ this.webcomm }/>
        <TabNav webcomm={ this.webcomm }/>
        <ChatInput />
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