import React, { MouseEvent } from "react";
import { connect, ConnectedProps } from "react-redux";


import { ClassName } from "./common-interfaces";
import store from "../state/store";
import { setActive } from "../state/action-creators";

// This will take the state from our redux store, and toggle the value in signupModal.
// It just returns the value needed by our component.  This is a common convention with redux
const mapState = (state: typeof store.state) => {
  console.log(`in mapState before: ${JSON.stringify(state, null, 2)}`)
  let newstate = Object.assign({}, state);
  console.log(`in mapState after: ${JSON.stringify(newstate, null, 2)}`)
  
  newstate.modal.isActive = !newstate.modal.isActive;
  return newstate.modal;
}

// This is basically an object that maps an actionCreator function to a name.  This will make
// react-redux add the name to the this.props of the Component.
const mapDispatch = {
  toggleState: setActive
}

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
  /**
   * TODO: Make this call an Action and dispatch it to the store.
   */
  private setActive = (_: MouseEvent<HTMLButtonElement>) => {
    console.log("Clicked button")
    let current = this.props.bulma.includes("is-active");
    this.props.toggleState(!current);
  }

  render() {
    return (
      <div className={ this.props.bulma }>
        <div className="modal-background"></div>
        <div className="modal-content">
          { this.props.children }
        </div>
        <button 
          className="modal-close is-large" 
          aria-label="close"
          onClick={this.setActive}>
        </button>
      </div>
    )
  }
}

// The call to connect returns the modified Modal class
export default connector(Modal);