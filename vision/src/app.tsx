
import * as React from "react";
import * as ReactDom from "react-dom";
import { Provider } from "react-redux";
import { createStore, StoreEnhancer } from "redux";

import { reducers } from "./state/store";
import NavBar from "./components/navbar";
import SideBar from "./components/sidebar-left";
import ChatInput from "./components/chat/chat-input";
import ChatContainer from "./components/chat/chat-container";
import { SideBarRight } from "./components/sidebar-right";

type WindowWithDevTools = Window & {
  __REDUX_DEVTOOLS_EXTENSION__: () => StoreEnhancer<unknown, {}>
 };

const isReduxDevtoolsExtenstionExist = (arg: Window | WindowWithDevTools)
                                       : arg is WindowWithDevTools  => {
  return  '__REDUX_DEVTOOLS_EXTENSION__' in arg;
};

const foo = isReduxDevtoolsExtenstionExist(window) ?
          window.__REDUX_DEVTOOLS_EXTENSION__() : undefined;
const store = createStore( reducers, foo);

class App extends React.Component {
  render() {
    return (
      <div className="app">
        <NavBar />
        <SideBar />
        <ChatContainer />
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