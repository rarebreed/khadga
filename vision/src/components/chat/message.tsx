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
				<div className="media-content">
					<div className="content">
						<p>
		          <strong>{ this.props.sender }</strong> <small>{ Date.now() }</small>
							<br />
							{ this.props.body }
						</p>
					</div>
					<nav className="level is-mobile">
						<div className="level-left">
							<a className="level-item">
								<span className="icon is-small"><i className="fas fa-reply"></i></span>
							</a>
							<a className="level-item">
								<span className="icon is-small"><i className="fas fa-heart"></i></span>
							</a>
						</div>
					</nav>
				</div>
				<div className="media-right">
					<button className="delete"></button>
				</div>
			</article>
		);
	}
}