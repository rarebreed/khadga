/**
 * This component module will handle 4 things:
 *
 * - A 3 column area
 * - One column for logged in users
 * - One column for which is a tabbed container to hold messages
 * - Third column for message threads
 *
 * An additional div will contain the text area for chats
 */

import React from "react";
import { ChatMessage } from "./message";
import UserList from "./user-list";
import { VideoStream } from "../inputs/webcam";

const mapPropsToState = () => {
  // TODO: Figure out what state we need here
};

export class ChatContainer extends React.Component {
	messages: ChatMessage[] = [];

  render() {
		const cntr = (
			<div className="columns is-fullheight" style={ { flex: 1 } }>
				<div className="column is-one-fifth has-background-black has-text-light">
					<UserList />
				</div>
				<div className="column">
					<ul>
						{ this.messages }
					</ul>
					<VideoStream />
				</div>
			</div>
		);

		return(
			// The last column needs to be dynamically allocated when a threaded view is needed
			cntr
		);
	}
}