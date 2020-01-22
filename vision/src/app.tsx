import * as React from "react";
import * as ReactDom from "react-dom";
import { NavBar } from "./components/navbar";

class App extends React.Component {
  render() {
    return (
      <div>
        <NavBar />
      </div>
    )
  }
}

ReactDom.render(<App />, document.querySelector("#app"));