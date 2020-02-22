import React from "react";

export interface INavBarItemProps {
	href?: string,
	classStyle?: string,
  callback?: (evt: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => void
}

export class NavBarItem extends React.Component<INavBarItemProps> {
  render() {
		let style = this.props.classStyle ? this.props.classStyle : "navbar-item";
    return (
			<li>
				<a className={ style } href={ this.props.href } onClick={ this.props.callback }>
					{ this.props.children }
				</a>
			</li>
    );
  }
}