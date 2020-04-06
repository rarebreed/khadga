import React from "react";
import {connect, ConnectedProps} from "react-redux";

import {State} from "../state/store";
import {loginReducer} from "../state/reducers";
import { WebComm } from "../state/communication";

const mapPropsToState = (state: State) => {
  return {
    connectState: state.connectState,
  };
};

const mapPropsToDispatch = {
  setConnectedUsers: loginReducer
};

const connector = connect(mapPropsToState, mapPropsToDispatch);
type PropsFromRedux = ConnectedProps<typeof connector> & {
  webcomm: WebComm
};

import ListItem from "./user";

class SideBar extends React.Component<PropsFromRedux>  {
  render() {
    const connected = Array.from(this.props.connectState.connected);

    const listItems = connected
      .filter(user => user !== "")
      .map((user) => {
        // const item = <li key={user}>{user}</li>;
        const item2 = <ListItem webcomm={ this.props.webcomm }
                                classStyle="username" 
                                name={ user } />;
        return item2;
      });
    
    const show = this.props.connectState.connected.length > 0;

    return (
      <div className="user-sidebar">
        <div className="user-section">
          <h2 className="user-header">Users</h2>
          <ul className="users">
            { show? listItems : null }
          </ul>
        </div>
      </div>
    );
  }
}

export default connector(SideBar);