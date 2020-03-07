import React from "react";

interface MessageBody {
	body: string,
	sender: string,
	time: string
}

type MediaProps = MessageBody & {
	avatar?: string
};

export class ChatMessage extends React.Component<MediaProps> {
	render() {
		const dt = new Date();

		return (
			<div className="message">
				<strong>{ this.props.sender }</strong> <small>{ this.props.time }</small>
				<br />
        <p>
					{ this.props.body }
				</p>
			</div>
		);
	}
}