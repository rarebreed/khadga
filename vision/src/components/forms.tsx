import * as React from "react";
import * as ReactDom from "react-dom";

interface NameProp {
	name: string
}

export class NamedField extends React.Component<NameProp, NameProp> {
	name: string

  constructor(props: NameProp) {
		super(props);
		this.name = props.name;

		this.state = {
			name: ""
		};
	}

	nameHandler = (evt: React.ChangeEvent<HTMLInputElement>) => {
		console.log(evt);
	}

	render() {
		return (
			<div className="field">
				<label className="label">
					{ this.props.name }
				</label>
				<div className="control">
					<input className="input" 
								 type="text" 
								 placeholder="e.g Alex Smith" 
								 onChange={ this. nameHandler }
					       />
				</div>
			</div>
		)
	}
}
