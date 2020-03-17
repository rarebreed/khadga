import React from "react";
import {connect, ConnectedProps} from "react-redux";

import {ChatMessage} from "./message";
import VideoStream from "../webrtc/webcam";
import {State} from "../../state/store";
import {logger} from "../../logger";
import { webcommAction } from "../../state//action-creators";

const mapStateToProps = (state: State) => {
  return {
    webcam: state.webcam,
    connected: state.connectState.loggedIn,
    user: state.connectState.username,
    websocket: state.websocket,
    messages: state.messages,
    webcomm: state.webcomm.webcomm
  };
};

const mapDispatchToProps = {
  setWebcomm: webcommAction
}

const connector = connect(mapStateToProps, mapDispatchToProps);
type PropsFromRedux = ConnectedProps<typeof connector>;

class ChatContainer extends React.Component<PropsFromRedux> {
  constructor(props: PropsFromRedux) {
    super(props);

    logger.log("ChatContainer is created");
  }
  /**
   * Creates the messages that will be displayed in the GUI
   *
   * Everytime a new message is sent, the state will change from redux, which will cause a re-render
   * and this will call this function.  Building up the messages.
   */
  makeChatMessage = () => {
    return this.props.messages.map((msg) => {
      const ownMessage = msg.sender === this.props.user;

      let chatmessage = <ChatMessage body={msg.body} sender={ msg.sender } time={ msg.time } />;
      if (ownMessage) {
        chatmessage = (
          <ChatMessage body={msg.body}
            sender={ msg.sender }
            time={ msg.time }
            highlight=" user-highlight"/>
        );
      }
      return chatmessage;
    });
  }

  addRemoteVideo = () => {
    logger.log("Checking for remote video");
    // This should never happen.  The webcomm is added when user selects "Chat".  We can't get a
    // video call offer unless we've logged into chat.  But this makes the compiler happy
    if (!this.props.webcomm) {
      logger.error("No webcomm yet");
      return null;
    }

    const { streamRemotes$ } = this.props.webcomm;
    let remoteStreams: [string, MediaStream][] = [];
    streamRemotes$.value.forEach((val, key) => {
      if (val) {
        remoteStreams.push([key, val])
      }
    });
    logger.log(`There are ${remoteStreams.length} number of remote streams`, remoteStreams);

    return remoteStreams.map(([key, val]) => {
      return (
        <VideoStream kind="remote" target={ key } stream={ val }></VideoStream>
      )
    })
  }

  addLocalVideo = () => {
    const showCam = this.props.webcam.active /* && this.props.connected */;
    if (!this.props.webcomm) {
      if (showCam) {
        logger.log("Showing local video prompted by user");
        return  <VideoStream kind="local" target={ this.props.user } />
      }
      return null;
    }
    
    const { streamLocal$ } = this.props.webcomm;
    if (streamLocal$.value.stream === null) {
      if (showCam) {
        logger.log("Showing local video prompted by user");
        return  <VideoStream kind="local" target={ this.props.user } />
      }
      return null;
    } else {
      logger.log("Showing local video created by offer");
      const stream = streamLocal$.value.stream;
      return (
        <VideoStream kind="local" target={ this.props.user } stream={ stream }></VideoStream>
      )
    }
  }

  render() {
    const showCam = this.props.webcam.active /* && this.props.connected */;
    logger.info(`ChatContainer: webcam.active = ${this.props.webcam.active}`);
    logger.info(`ChatContainer: connected = ${this.props.connected}`);

    const cntr = (
      <div className="main-body" style={ {flex: 1} }>
        <div className="chat-window">
          { this.addLocalVideo() }
          { this.addRemoteVideo() }
          <ul className="chat-messages">
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