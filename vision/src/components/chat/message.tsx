import React from "react";

export interface MessageBody {
	body: string;
	sender: string;
	time: string;
}

type MediaProps = MessageBody & {
	avatar?: string;
	highlight?: string;
};

export class ChatMessage extends React.Component<MediaProps> {
  render() {
    const style = this.props.highlight ? "message" + this.props.highlight : "message";

    return (
      <div className={ style }>
        <strong>{ this.props.sender }</strong> <small>{ this.props.time }</small>
        <br />
        <p>
          { this.props.body }
        </p>
      </div>
    );
  }
}