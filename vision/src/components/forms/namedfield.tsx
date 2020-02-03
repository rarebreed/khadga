import React, { Component } from "react";
import { NamePropState } from "../../state/types";
import store from "../../state/store";

const logger = console;

export type InputTypeProps = NamePropState<string> & {
	inputType?: "text" | "password"
};

/**
 * This abstract class can be used for a named field in forms.
 *
 * A subclass of this class can be used to store input data into a redux store
 */
export abstract class NamedField<T extends InputTypeProps> extends Component<T> {

	abstract nameHandler = (evt: React.ChangeEvent<HTMLInputElement>) => {
		logger.log(evt);
	}

	render() {
		logger.log(`In NamedField: ${JSON.stringify(this.props, null, 2)}`);
		return (
			<div className="field">
				<label className="label has-text-light">
					{ this.props.name }
				</label>
				<div className="control">
					<input className="input"
								 type={ this.props.inputType || "text" }
								 placeholder={ this.props.value }
								 onChange={ this.nameHandler }
					       />
				</div>
			</div>
		);
	}
}