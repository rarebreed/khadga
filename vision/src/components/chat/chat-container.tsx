import React from "react";
import { connect, ConnectedProps } from "react-redux";

import { ChatMessage } from "./message";
import { VideoStream } from "../webrtc/webcam";
import { State } from "../../state/store";
import { logger } from "../../logger";

const mapStateToProps = (state: State) => {
  return {
		webcam: state.webcam,
		connected: state.connectState.loggedIn,
		websocket: state.websocket,
		messages: state.messages
	};
};

const connector = connect(mapStateToProps);
type PropsFromRedux = ConnectedProps<typeof connector>;

class ChatContainer extends React.Component<PropsFromRedux> {

	/**
	 * Creates the messages that will be displayed in the GUI
	 *
	 * Everytime a new message is sent, the state will change from redux, which will cause a re-render
	 * and this will call this function.  Building up the messages.
	 */
	makeChatMessage = () => {
		return this.props.messages.map(msg => {
			return (
				<ChatMessage body={msg.body} sender={ msg.sender }/>
			);
		});
	}

  render() {
		const showCam = this.props.webcam.active && this.props.connected;
		logger.info(`webcam.active = ${this.props.webcam.active}`);
		logger.info(`connected = ${this.props.connected}`);

		const cntr = (
			<div className="columns is-fullheight" style={ { flex: 1 } }>
				<div className="column">
				  { showCam ? <VideoStream /> : null }
					<ul>
						{ this.makeChatMessage() }
					</ul>
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