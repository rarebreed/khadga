import React from "react";
import { connect, ConnectedProps } from "react-redux";

import { State } from "../state/store";
import { setActive } from "../state/action-creators";
import { Module } from "module";
const logger = console;

// mapState returns only what is needed from the store to this component
const mapState = (state: State) => {
  const newstate = Object.assign({}, state.modal);
  const signupState = Object.assign({}, state.signup);

  const combined = {
    modal: newstate,
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
export const connector = connect(mapState, mapDispatch);
type PropsFromRedux = ConnectedProps<typeof connector>;

export type ModalProps = PropsFromRedux & {
  children?: React.ReactNode,
  bulma: string
};