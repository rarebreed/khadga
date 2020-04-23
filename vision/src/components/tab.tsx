/**
 * This is a component that exists in a tabbed interface
 */
import React, { useState } from "react";
import { useSelector } from "react-redux";

import { State } from "../state/store";

interface TabProps {
  active: boolean;
  name: string;
}

/**
 * Reuseable component that is a tab inside of our TabNav
 * 
 * @param props 
 */
export const Tab: React.FC<TabProps> = (props) => {
  const activeTab = useSelector((state: State) => {
    return state.tab
  });
  
  return (
    <div className={ activeTab === props.name ? "active-tab" : "inactive-tab" }>
      { props.children }
    </div>
  )
}


/**
 * SubTabs are not hooked into redux and are used for nested tabs
 * 
 * The only real difference between this and Tab is that it is not hooked into redux.  The active
 * tab is instead determined solely by the props passed in
 * 
 * @param props 
 */
export const SubTab: React.FC<TabProps> = (props) => {
  return (
    <div className={ props.active ? "active-tab" : "inactive-tab" }>
      { props.children }
    </div>
  )
}
