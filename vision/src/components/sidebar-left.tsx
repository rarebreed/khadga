import React from "react";
import {connect, ConnectedProps} from "react-redux";

import {State} from "../state/store";
import {loginReducer} from "../state/reducers";

const logger = console;

const mapPropsToState = (state: State) => {
  logger.log("in user-list mapPropsToState", state);
  return {
    connectState: state.connectState,
    socket: state.websocket.socket
  };
};

const mapPropsToDispatch = {
  setConnectedUsers: loginReducer
};

const connector = connect(mapPropsToState, mapPropsToDispatch);
type PropsFromRedux = ConnectedProps<typeof connector>;

import ListItem from "./user";

class SideBar extends React.Component<PropsFromRedux>  {
  render() {
    const connected = Array.from(this.props.connectState.connected);

    const listItems = connected
      .filter(user => user !== "")
      .map((user) => {
        // const item = <li key={user}>{user}</li>;
        const item2 = <ListItem classStyle="username" name={ user } />;
        return item2;
      });

    return (
      <div className="user-sidebar">
        <div className="user-section">
          <h2 className="user-header">Users</h2>
          <ul className="users">
            { this.props.socket ? listItems : null }
          </ul>
        </div>
      </div>
    );
  }
}

export default connector(SideBar);