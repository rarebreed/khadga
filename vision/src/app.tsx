import * as React from "react";
import * as ReactDom from "react-dom";
import { Provider } from "react-redux";
import { createStore } from "redux";

import { reducers } from "./state/store";
import NavBar from "./components/navbar";
import ChatContainer from "./components/chat/chat-container";

const logger = console;
import * as noesis from "@khadga/noesis";
const store = createStore(reducers);

interface ContainerStyle {
  [key: string]: string
}

class App extends React.Component {
  render() {
    return (
      <div className="is-flex vision-container" id="main-container">
        <NavBar />
        <ChatContainer />
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