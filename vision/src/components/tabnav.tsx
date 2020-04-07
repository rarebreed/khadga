import React from "react";
import { useSelector } from "react-redux";

import { Tab } from "./tab";
import ChatContainer from "./chat/chat-container";
import { WebComm } from "../state/communication";
import { Blog } from "./blog";
import { State } from "../state/store";
import { Editor } from "./editor";

interface TabNavProps {
  webcomm: WebComm;
  className: string
}

/**
 * Non-reuseable component that is a container for our tabs
 * 
 * Note that this is not reuseable since we can't type out what props.children are
 * 
 * @param props 
 */
export const TabNav: React.FC<TabNavProps> = (props) => {
  const activeTab = useSelector((state: State) => state.tab);

  const tabs = [
    <Tab name="chat" active={ activeTab === "chat" ? true : false }>
      <ChatContainer webcomm={ props.webcomm }/>
    </Tab>,
    <Tab name="blog" active={ activeTab === "blog" ? true : false }>
      <Blog active={ true } />
    </Tab>,
    <Tab name="editor" active={ activeTab === "editor" ? true : false }>
      <Editor webcomm={ props.webcomm }></Editor>
    </Tab>
  ]

  // The CSS will display this as a flex container where tab-nav is flex-direction: column
  // The tab-buttons class will display as a flex row.
  return (
    <div className={ props.className }>
      <div className="tabs-main">
        { tabs }
      </div>
    </div>
  )
}

export const SubTabNav: React.FC<TabNavProps> = (props) => {
  return (
    <div className={ props.className }>
      <div className="tabs-main">
        { props.children }
      </div>
    </div>
  )
}