import React, { useState } from "react";

import { Tab } from "./tab";
import ChatContainer from "./chat/chat-container";
import { WebComm } from "../state/communication";
import { Blog } from "./blog";

interface TabNavProps {
  webcomm: WebComm
}

/**
 * Non-reuseable component that is a container for our tabs
 * 
 * Note that this is not reuseable since we can't type out what props.children are
 * 
 * @param props 
 */
export const TabNav: React.FC<TabNavProps> = (props) => {
  const [x, y] = useState();

  const tabs = [
    <Tab name="chat" active={ false }>
      <ChatContainer webcomm={ props.webcomm }/>
    </Tab>,
    <Tab name="blog" active={ true }>
      <Blog active={ true } />
    </Tab>
  ]

  // Handler that will set the active (ie visible) Tab when the button is clicked
  const onClick = (name: string) => (evt: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    
  }

  const buttons = tabs.map(elm => {
    const name = elm.props.name;
    return (
      <button onClick={ onClick(name) }>
        {name}
      </button>
    )
  });

  // The CSS will display this as a flex container where tab-nav is flex-direction: column
  // The tab-buttons class will display as a flex row.
  return (
    <div className="tab-nav">
      <div className="tabs-main">
        { tabs }
      </div>
      <div className="tab-buttons">
        { buttons }
      </div>
    </div>
  )
}