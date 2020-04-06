/**
 * This is a component that exists in a tabbed interface
 */
import React from "react";
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
