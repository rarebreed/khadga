import React from "react";
import {connect, ConnectedProps} from "react-redux";

import {ChatMessage} from "./message";
import VideoStream, { StreamProps } from "../webrtc/webcam";
import {State} from "../../state/store";
import {logger} from "../../logger";
import { WebComm } from "../../state/communication";

const mapStateToProps = (state: State) => {
  return {
    webcam: state.webcam,
    connected: state.connectState.loggedIn,
    user: state.connectState.username,
    messages: state.messages,
    remoteVideo: state.remoteVideo
  };
};

const connector = connect(mapStateToProps);
type PropsFromRedux = ConnectedProps<typeof connector> & {
  webcomm: WebComm
};

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
    logger.debug("Checking for remote video");
    // This should never happen.  The webcomm is added when user selects "Chat".  We can't get a
    // video call offer unless we've logged into chat.  But this makes the compiler happy
    if (!this.props.webcomm) {
      logger.warn("No webcomm yet");
      return null;
    }

    const { remoteVideo } = this.props;
    let remoteStreams: [string, MediaStream][] = [];
    remoteVideo.forEach((val, key) => {
      if (val) {
        remoteStreams.push([key, val])
      }
    });
    logger.info(`There are ${remoteStreams.length} number of remote streams`, remoteStreams);

    // This is a hack.  Shouldn't be mutating inside a map
    let offsetIdx = 1;
    const offset = (offset: number) => (360 * offset) + 10;
    return remoteStreams.map(([key, val]) => {
      const pos = { top: `${offset(offsetIdx)}px` };
      const vidprops: StreamProps = { 
        kind: "remote",
        target: key,
        stream: val,
        pos,
        webcomm: this.props.webcomm
      };
      offsetIdx++;
      return (
        <VideoStream { ...vidprops }></VideoStream>
      )
    })
  }

  addLocalVideo = () => {
    const showCam = this.props.webcam.active /* && this.props.connected */;
    const { webcomm, user } = this.props;
    if (showCam) {
      logger.debug("Showing local video prompted by user");
      return <VideoStream kind="local" target={ user } webcomm={ webcomm} />
    }
    
    const { streamLocal$ } = this.props.webcomm;
    if (streamLocal$.value.stream === null) {
      if (showCam) {
        logger.debug(`Showing local video prompted by`, this.props.user);
        return <VideoStream kind="local" target={ user } webcomm={ webcomm} />
      }
      return null;
    } else {
      logger.debug("Showing local video created by offer");
      const stream = streamLocal$.value.stream;
      return (
        <VideoStream kind="local"
                     target={ this.props.user } 
                     stream={ stream }
                     webcomm={ webcomm } />
      )
    }
  }

  render() {
    logger.debug(`ChatContainer: webcam.active = ${this.props.webcam.active}`);
    logger.debug(`ChatContainer: connected = ${this.props.connected}`);

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