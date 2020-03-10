import React from "react";
import { connect, ConnectedProps } from "react-redux";

import { State } from "../state/store";
import { selectUserAction } from "../state/action-creators";
import { AnchorEvent, ClickEvent } from "../state/types";
import { logger } from "../logger";

interface Item {
	classStyle: string,
	name: string
}

const mapPropsToState = (state: State) => {
	return {
		selected: state.selectedUsers,
		username: state.connectState.username,
		connected: state.connectState.connected
	};
};

const mapPropsToDispatch = {
	setUser: selectUserAction
};

const connector = connect(mapPropsToState, mapPropsToDispatch);
type PropsFromRedux = ConnectedProps<typeof connector> & Item;

class ListItem extends React.Component<PropsFromRedux> {
	checked: boolean;

	constructor(props: PropsFromRedux) {
		super(props);

		this.checked = false;
	}

	setCheck = (evt: ClickEvent<HTMLInputElement>) => {
		if (!this.checked) {
			this.props.setUser(this.props.name, "ADD_USER");
		} else {
			this.props.setUser(this.props.name, "REMOVE_USER");
		}
		this.checked = !this.checked;
	}

	render() {
		const id = `user-${this.props.name}`;
		const classStyle = this.props.name === this.props.username ? "highlighted" : "";
		const color = this.props.connected.includes(this.props.name) ? "green" : "grey";
		return (
			<li className={ this.props.classStyle }>
				<span className="user-avatar">
					<input className="select-user"
								 id={id}
					       onClick={ this.setCheck }
					       type="checkbox" />
					<label className={ classStyle } htmlFor={id}>{ this.props.name }</label>
					<i className="far fa-user" style={{ color, margin: "0 4px"}}/>
				</span>
			</li>
		);
	}
}

export default connector(ListItem);