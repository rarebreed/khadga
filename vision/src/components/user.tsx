import React from "react";

interface Item {
	classStyle: string,
	name: string
}

export class ListItem extends React.Component<Item> {
	render() {
		return (
			<li className={ this.props.classStyle }>
				<span className="user-avatar">
					<i className="far fa-user" style={{ color: "green", margin: "0 4px"}}/>
				</span>
				{ this.props.name }
			</li>
		)
	}
}