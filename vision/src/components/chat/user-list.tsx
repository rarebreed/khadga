import React from "react";
import { connect, ConnectedProps } from "react-redux";

import { State } from "../../state/store";
import { loginReducer } from "../../state/reducers";

const logger = console;

const mapPropsToState = (state: State) => {
	logger.log("in user-list mapPropsToState", state);
	return Object.assign({}, state.connectState);
};

const mapPropsToDispatch = {
	setConnectedUsers: loginReducer
};

const connector = connect(mapPropsToState, mapPropsToDispatch);
type PropsFromRedux = ConnectedProps<typeof connector>;

class UserList extends React.Component<PropsFromRedux> {
	render() {
		let index = 0;
		const listItems = this.props.connected.map(user => {
			const item = <li key={index}>{user}</li>;
			index++;
			return item;
		});

		return(
			<ul>
				{ listItems }
			</ul>
		);
	}
}

export default connector(UserList);