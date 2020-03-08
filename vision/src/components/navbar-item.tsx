import React, { useState } from "react";

export interface INavBarItemProps {
  href?: string,
  classStyle?: string,
  callback?: (evt: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => void
}

export class NavBarItem extends React.Component<INavBarItemProps> {
  render() {
		const style = this.props.classStyle ? this.props.classStyle : "navbar-item";
    return (
			<div>
				<a className={ style } href={ this.props.href } onClick={ this.props.callback }>
					{ this.props.children }
				</a>
			</div>
    );
  }
}

interface Dropdown {
	value: string,
	children?: React.ReactNode,
	classStyle?: string
}

/**
 * Functional component
 */
export const NavBarDropDown = (props: Dropdown) => {
	return(
		<div className={ props.classStyle ? props.classStyle : "dropdown" }>
			<a href="javascript:void(0)" className="dropbtn">{ props.value }</a>
			<div className="dropdown-content">
				{ props.children }
			</div>
  	</div>
	);
};