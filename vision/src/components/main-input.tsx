import React from "react";
import {connect, ConnectedProps} from "react-redux";

import {WsMessage} from "../state/message-types";
import {State} from "../state/store";
import {chatMessageAction} from "../state/action-creators";
import { WebComm } from "../state/communication";

const logger = console;

interface TextState {
  message: string,
  target: React.RefObject<HTMLTextAreaElement>,
}

const mapPropsToState = (store: State) => {
  return {
    loggedIn: store.connectState.loggedIn,
    connected: store.connectState.connected,
    username: store.connectState.username,
    selectedUsers: store.selectedUsers,
    activeTab: store.tab
  };
};

const mapPropsToDispatch = {
  sendMessage: chatMessageAction
};

const textInputConnector = connect(mapPropsToState, mapPropsToDispatch);
type PropsFromReduxLogin = ConnectedProps<typeof textInputConnector> & {
  webcomm: WebComm
};

class ChatInput extends React.Component<PropsFromReduxLogin, TextState> {
  message: string;
  target: React.RefObject<HTMLTextAreaElement>;
  ctlKeyDown: boolean;
  mode: "single" | "multi";

  constructor(props: PropsFromReduxLogin) {
    super(props);
    this.message = "";
    this.target = React.createRef();
    this.ctlKeyDown = false;
    this.mode = props.activeTab === "chat" ? "single" : "multi";

    this.state = {
      message: this.message,
      target: this.target,
    };
  }

  dataHandler = (evt: React.ChangeEvent<HTMLTextAreaElement>) => {
    this.setState({
      message: evt.target.value
    });
  }

  onDown = (evt: React.KeyboardEvent) => {
    if (evt.key === "Control") {
      this.ctlKeyDown = true;
    }

    if (evt.key === "Enter" && this.ctlKeyDown) {
      this.sendMessage();
    }
  }

  onUp = (evt: React.KeyboardEvent) => {
    if (evt.key === "Control") {
      this.ctlKeyDown = false;
    }
  }

  private sendMessage = () => {
    if (this.state.message.length <= 0) {
      logger.info("Empty message");
      return;
    }
    
    // check to see if we are addressing individual member(s)
    let recipients: string[] = Array.from(this.props.connected);
    if (this.props.selectedUsers.length > 0) {
      // If recipients only includes the logged in User, assume it's a public message
      const {selectedUsers, username} = this.props;
      if (selectedUsers.length === 1 && selectedUsers[0] === username) {
        logger.log(`Only ${username} in selected-users list`);
      } else {
        recipients = this.props.selectedUsers;
      }
    }

    // Always include ourself in the recipients list
    if (!this.props.selectedUsers.includes(this.props.username)) {
      recipients.push(this.props.username);
    }

    // Check to see if we are only messaging certain users
    if (this.state.message.startsWith("[")) {
      let results = this.state.message.split(/\[(.+)\]/);
      results = results.filter(r => r !== "");
      if (results.length === 0) {
        alert("error parsing message.  Format is:\n[@user1,@user2] message");
        return;
      }
      recipients = results[0].split(",").map(user => user.replace("@", ""));
    }

    // Create the WsMessage type that will be sent to the websocket handler in WebComm
    const msg = this.makeWSMessage(this.state.message);
    msg.recipients = recipients;

    logger.log("sending", msg);
    this.props.webcomm.send$.next(JSON.stringify(msg));

    if (this.target.current) {
      this.target.current.value = "";
    }

    this.setState({
      message: ""
    });
  }

  /**
   * This is the simple editor used for one author writing things at a time.
   * 
   * It is simple because it's just passing along the entire contents which will then be sent to the
   * div
   */
  private editor = () => {
    
  }

  /**
   * This is the complex editor used for collaborative writing.
   *
   * This method will send  _changes_ to a linked list.  We need to keep track of where the user's
   * cursor is.  This will be the node where the user is currently editing.  When another user edits
   * a part of the text, only the part that has changed will be transmitted.  Each message will
   * therefore contain:
   *
   * - If an insertion:
   *   - The nth node of where the edit is happening (where n is the node insertion before editing)
   *   - The length of the new insertion
   * - If a deletion
   *   - Count how many nodes are being deleted
   *   - _snip_ it from the common linked list
   * - If an edit
   *   - Get the insertion point
   *   - Overwrite N nodes with the new values
   *
   * This data is actually itself a new linked list.  The advantage of linked lists is inserting. If
   * this was done as an array, and someone inserted something in the middle, you would have to
   * shift many items and quite possibly allocate a new array.  Might look into using immutablejs as
   * the common data structure for the editor data backing.
   *
   * Note that we also need to have some kind of debouncing here.  We don't want every single
   * keystroke the user enters to be sent over.  We also don't want to force the user to have to
   * click the "Send" button.  All the editing should be seen in semi real time.  We can use rxjs's
   * debounce operator to handle this.
   *
   * TODO:  We might want to subclass main-input.tsx into multiple classes rather than have a
   * "mode".  This way you only have one kind of "editor" function. If the activeTab is chat, it's
   * the old style and you only have one function which is the original sendMessage.  If you're in
   * "blog" as the activeTab, then you use the simple `editor` method.  Otherwise, you use the
   * multiEditor style functionality.  This will be cleaner
   */
  private multiEditor = () => {

  }

  send = (evt: React.MouseEvent<HTMLButtonElement>) => {
    this.sendMessage();
  }

  makeWSMessage = (body: string, recipients: string[] = []): WsMessage<string> => {
    if (recipients.length === 0) {
      recipients = Array.from(this.props.connected);
    }

    const msg: WsMessage<string> = {
      sender: this.props.username,
      recipients,
      body,
      event_type: "Message",
      time: Date.now()
    };

    return msg;
  }

  render() {
    return (
      <div className="chat-input">
        <div className="field-group">
          <textarea className="chat-text"
            cols={1}
            wrap={"hard"}
            ref={this.target}
            onKeyDown={this.onDown}
            onKeyUp={this.onUp}
            onInput={this.dataHandler} />
          <button onClick={this.send}>
            Send
          </button>
        </div>
      </div>
    );
  }
}

export default textInputConnector(ChatInput);