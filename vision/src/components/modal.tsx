import React, { MouseEvent } from "react";
import { connect, ConnectedProps } from "react-redux";

import store from "../state/store";
import { setActive } from "../state/action-creators";

const logger = console;

// mapState returns only what is needed from the store to this component
const mapState = (state: typeof store.state) => {
  const newstate = Object.assign({}, state.modal);
  const signupState = Object.assign({}, state.signup);

  const combined = {
    isActive: newstate.isActive,
    signup: signupState
  };
  logger.log(`in modal mapState`, combined);

  return combined;
};

// This is basically an object that maps an actionCreator function to a name.  This will make
// react-redux add the name to the this.props of the Component.
const mapDispatch = {
  setActive
};

// For typescript, you have to split up the call to connect in 2 distinct phases
const connector = connect(mapState, mapDispatch);
type PropsFromRedux = ConnectedProps<typeof connector>;

type ModalProps = PropsFromRedux & {
  children?: React.ReactNode,
  bulma: string
};

export interface ModalId {
  id: string
}

class Modal extends React.Component<ModalProps> {
  constructor(props: ModalProps) {
    super(props);
    logger.debug(`In Modal Constructor: props`, props);
  }

  private setActive = (_: MouseEvent<HTMLButtonElement>) => {
    const current = this.props.isActive;
    logger.debug(`Clicked button: current = ${current}`);
    this.props.setActive(!current);
  }

  private cancel = (_: MouseEvent<HTMLAnchorElement>) => {
    this.props.setActive(false);
  }

  private submit = (_: MouseEvent<HTMLAnchorElement>) => {
    // TODO: Make request to khadga backend to add a user
    logger.debug("TODO: Add user to mongodb");
  }

  render() {
    const className = "modal" + (this.props.isActive ? ` is-active` : "");
    logger.log(`Modal className will be ${className}`);
    return (
      <div className={ className }>
        <div className="modal-background"></div>
        <div className="modal-content">
          { this.props.children }

        <div className="field is-grouped">
          <p className="control">
            <a className="button is-primary">
              Submit
            </a>
          </p>
          <p className="control">
            <a className="button is-light"
               onClick={ this.cancel }>
              Cancel
            </a>
          </p>
        </div>
        </div>

        <button
          className="modal-close is-large"
          aria-label="close"
          onClick={this.setActive}>
        </button>
      </div>
    );
  }
}

// The call to connect returns the modified Modal class
export default connector(Modal);