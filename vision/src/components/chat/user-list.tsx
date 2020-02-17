import React from "react";
import { connect, ConnectedProps } from "react-redux";

import { State } from "../../state/store";
import { loginReducer } from "../../state/reducers";

const logger = console;

const mapPropsToState = (state: State) => {
	logger.log("in user-list mapPropsToState", state);
	return {
		connectState: state.connectState
	};
};

const mapPropsToDispatch = {
	setConnectedUsers: loginReducer
};

const connector = connect(mapPropsToState, mapPropsToDispatch);
type PropsFromRedux = ConnectedProps<typeof connector>;

class UserList extends React.Component<PropsFromRedux> {
	render() {
		const connected = Array.from(this.props.connectState.connected);
		const listItems = connected.map(user => {
			const item = <li key={user}>{user}</li>;
			return item;
		});

		return(
			<div>
				<ul>
				  { listItems }
			  </ul>
			</div>
		);
	}
}

export default connector(UserList);