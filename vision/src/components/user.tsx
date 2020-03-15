import React from "react";
import { connect, ConnectedProps, useSelector } from "react-redux";

import { State } from "../state/store";
import { selectUserAction, peerConnAction } from "../state/action-creators";
import { ClickEvent } from "../state/types";
import { logger } from "../logger";
import { WebComm } from "../components/webrtc/communication";
const log = logger.log;

interface Item {
  classStyle: string,
  name: string
}

const mapPropsToState = (state: State) => {
  return {
    selected: state.selectedUsers,
    username: state.connectState.username,
    connected: state.connectState.connected,
    peer: state.peer
  };
};

const mapPropsToDispatch = {
  setUser: selectUserAction,
  setPeer: peerConnAction
};

const connector = connect(mapPropsToState, mapPropsToDispatch);
type PropsFromRedux = ConnectedProps<typeof connector> & Item;

interface PopupState {
  enabled: boolean;
  x: number;
  y: number;
}

class ListItem extends React.Component<PropsFromRedux, PopupState> {
  checked: boolean;
  userId: React.RefObject<HTMLLIElement>;
  labelId: React.RefObject<HTMLLabelElement>;

  constructor(props: PropsFromRedux) {
    super(props);

    this.checked = false;
    this.userId = React.createRef();
    this.labelId = React.createRef();

    this.state = {
      enabled: false,
      x: 0,
      y: 0
    };
  }

  componentDidMount() {
    if (this.userId.current) {
      logger.log("Disabling contextmenu for list item");
      const elmnt = this.userId.current;

      elmnt.addEventListener("contextmenu", (evt: MouseEvent) => {
        evt.preventDefault();
        logger.log("Preventing right mouse click default");
        if (this.labelId.current) {
          if (this.labelId.current.innerHTML === this.props.username) {
            logger.log("Can't do webcam session with yourself!");
            return;
          }
        }

        logger.log("mouse details: ", evt);

        this.setState({
          enabled: true,
          x: evt.clientX,
          y: evt.clientY
        });
      });

    } else {
      logger.log("Unable to disable contextmenu: ", this.userId);
    }
  }

  disablePopup = (evt?: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    this.setState({
      enabled: false
    });
  }

  setCheck = (evt: ClickEvent<HTMLInputElement>) => {
    if (!this.checked) {
      this.props.setUser(this.props.name, "ADD_USER");
    } else {
      this.props.setUser(this.props.name, "REMOVE_USER");
    }
    this.checked = !this.checked;
  }

  render() {
    const id = `user-${ this.props.name }`;
    const classStyle = this.props.name === this.props.username ? "highlighted" : "";
    const color = this.props.connected.includes(this.props.name) ? "green" : "grey";
    const popstateClassName = this.state.enabled ? "user-popup-enabled" : "user-popup-hidden";

    return (
      <li ref={ this.userId } className={ this.props.classStyle }>
        <div className="user-avatar">
          <input className="select-user"
            id={ id }
            onClick={ this.setCheck} 
            type="checkbox" />
          <label ref={ this.labelId }
            className={ classStyle }
            htmlFor={ id }>
            {this.props.name}
          </label>
          <i className="far fa-user" style={{ color, margin: "0 4px" }} />
        </div>
        <PopupMenu classStyle={ popstateClassName }
          name={ this.props.name }
          x={ this.state.x }
          y={ this.state.y }
          setPeer={ this.props.setPeer }
          disable={ this.disablePopup }></PopupMenu>
      </li>
    );
  }
}

interface PopupProps {
  x: number;
  y: number;
  name: string;
  classStyle: string;
  disable: (evt?: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
  setPeer: typeof peerConnAction
}

/**
 * Functional component
 */
const PopupMenu = (props: PopupProps) => {
  const webcomm = useSelector((state: State) => state.webcomm.webcomm);

  const disablePopup = () => {
    props.disable();
  };

  const invite = () => {
    // Check if webcomm has been created
    if (webcomm === null) {
      alert("User has not logged in yet");
      return;
    }
    // Check if we have RTCPeerConnection.
    if (!webcomm.peer) {
      logger.info("Setting up RTCPeerConnection");
      webcomm.peer = webcomm.createPeerConnection();
    }

    // Push the target to the webcomm.  Its handleVideoOffer will take this value, and use it create
    // an SDPOffer message
    webcomm.targets$.next(props.name);

    
  };

  const { classStyle, y, x } = props;
  return (
    <div className={ classStyle } style={{ top: `${y - 55}px`, left: `${x + 20}px` }}>
      <label>Videocall?</label>
      <button onClick={ invite }>Start</button>
      <button onClick={ disablePopup }>Cancel</button>
    </div>
  );
};

export default connector(ListItem);