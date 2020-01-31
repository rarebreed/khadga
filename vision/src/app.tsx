import * as React from "react";
import * as ReactDom from "react-dom";
import { Provider } from "react-redux";
import { createStore } from "redux";

import { reducers } from "./state/store";
import NavBar from "./components/navbar";
import { setActive } from "./state/action-creators";
import { ChatContainer } from "./components/chat/chat-container";

const store = createStore(reducers);

class App extends React.Component {
  render() {
    return (
      <div>
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