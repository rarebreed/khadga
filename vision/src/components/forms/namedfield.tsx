import React, { Component } from "react";
import { NamePropState } from "../../state/types";
import store from "../../state/store";

const logger = console;

/**
 * This abstract class can be used for a named field in forms.
 *
 * A subclass of this class can be used to store input data into a redux store
 */
export abstract class NamedField<T extends NamePropState<string>> extends Component<T> {

	abstract nameHandler = (evt: React.ChangeEvent<HTMLInputElement>) => {
		logger.log(evt);
	}

	render() {
		return (
			<div className="field">
				<label className="label has-text-light">
					{ this.props.name }
				</label>
				<div className="control">
					<input className="input"
								 type="text"
								 placeholder={ this.props.value }
								 onChange={ this.nameHandler }
					       />
				</div>
			</div>
		);
	}
}