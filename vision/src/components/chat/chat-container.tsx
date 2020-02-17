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
import { connect, ConnectedProps } from "react-redux";

import { ChatMessage } from "./message";
import UserList from "./user-list";
import { VideoStream } from "../inputs/webcam";
import { State } from "../../state/store";
import { BlogPost } from "../blogs/blog";
import { logger } from "../../logger";
import TextInput from "../../components/inputs/text";

const mapStateToProps = (state: State) => {
  return {
		webcam: state.webcam,
		connected: state.connectState.loggedIn,
		websocket: state.websocket
	};
};

const connector = connect(mapStateToProps);
type PropsFromRedux = ConnectedProps<typeof connector>;

class ChatContainer extends React.Component<PropsFromRedux> {
  messages: ChatMessage[] = [];

  render() {
		const showCam = this.props.webcam.active && this.props.connected;
		logger.info(`webcam.active = ${this.props.webcam.active}`);
		logger.info(`connected = ${this.props.connected}`);
		const cntr = (
			<div className="columns is-fullheight" style={ { flex: 1 } }>
				<div className="column is-one-fifth has-background-black has-text-light">
					<UserList />
				</div>
				<div className="column has-text-right">
				  { showCam ? <VideoStream /> : null }
					<BlogPost />
					<ul>
						{ this.messages }
					</ul>
          <TextInput />
				</div>
			</div>
		);

		return(
			// The last column needs to be dynamically allocated when a threaded view is needed
			cntr
		);
	}
}

export default connector(ChatContainer);