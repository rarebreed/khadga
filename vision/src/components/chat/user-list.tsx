import React from "react";
import { connect, ConnectedProps } from "react-redux";

import store from "../../state/store";
import { loginReducer } from "../../state/reducers";

const logger = console;

const mapPropsToState = (state: typeof store.state) => {
	logger.log(state);
	return {
		connectedUsers: Array.from(state.connectedUsers)
	};
};

const mapPropsToDispatch = {
	setConnectedUsers: loginReducer
};

const connector = connect(mapPropsToState, mapPropsToDispatch);
type PropsFromRedux = ConnectedProps<typeof connector>;

class UserList extends React.Component<PropsFromRedux> {
	render() {
		let index = 0;
		const listItems = this.props.connectedUsers.map(user => {
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