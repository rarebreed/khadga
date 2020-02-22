import React from "react";

interface MessageBody {
	body: string,
	sender: string
}

type MediaProps = MessageBody & {
	avatar?: string
};

export class ChatMessage extends React.Component<MediaProps> {
	render() {
		return (
			<article className="media">
        <p>
					<strong>{ this.props.sender }</strong> <small>{ Date.now() }</small>
					<br />
					{ this.props.body }
				</p>
			</article>
		);
	}
}