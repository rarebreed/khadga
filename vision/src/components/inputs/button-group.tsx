import React from "react";

class ButtonGroup extends React.Component {
	render() {
		return (
			<div className="field is-grouped">
				<p className="control">
					<a className="button is-primary">
						Submit
					</a>
				</p>
				<p className="control">
					<a className="button is-light">
						Cancel
					</a>
				</p>
			</div>
		);
	}
}