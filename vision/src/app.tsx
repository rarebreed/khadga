import * as React from "react";
import * as ReactDom from "react-dom";
import { Provider } from "react-redux";
import { createStore } from "redux";

import { reducers } from "./state/store";
import NavBar from "./components/navbar";
import { ChatContainer } from "./components/chat/chat-container";

const logger = console;
import * as noesis from "@khadga/noesis";
const store = createStore(reducers);

interface ContainerStyle {
  [key: string]: string
}

class App extends React.Component {
  style: ContainerStyle = {
    "flex-direction": "column",
    height: "100vh"
  };

  render() {
    return (
      <div className="is-flex" id="main-container" style={ this.style }>
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