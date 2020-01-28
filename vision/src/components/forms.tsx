import * as React from "react"
import { logger } from "../logger"

interface NameProp {
	name: string
}

export class NamedField extends React.Component<NameProp, NameProp> {
	name: string

  constructor(props: NameProp) {
		super(props)
		this.name = props.name

		this.state = {
			name: ""
		}
	}

	nameHandler = (evt: React.ChangeEvent<HTMLInputElement>) => {
		logger.log(evt)
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
								 placeholder="e.g Alex Smith"
								 onChange={ this. nameHandler }
					       />
				</div>
			</div>
		)
	}
}


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
		)
	}
}