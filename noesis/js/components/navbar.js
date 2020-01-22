import * as React from "react";
class NavBarItem extends React.Component {
    render() {
        return (React.createElement("a", { className: "navbar-item" }, this.props.item));
    }
}
class NavBarLink extends React.Component {
    render() {
        return (React.createElement("a", { className: "navbar-link" }, this.props.link));
    }
}
class NavBar extends React.Component {
    render() {
        return (React.createElement("nav", { className: "navbar", role: "navigation", "aria-label": "main navigation" },
            React.createElement("div", { className: "navbar-brand" },
                React.createElement("a", { className: "navbar-item", href: "https://bulma.io" },
                    React.createElement("img", { src: "https://bulma.io/images/bulma-logo.png", width: "112", height: "28" })),
                React.createElement("a", { role: "button", className: "navbar-burger burger", "aria-label": "menu", "aria-expanded": "false", "data-target": "navbarBasicExample" },
                    React.createElement("span", { "aria-hidden": "true" }),
                    React.createElement("span", { "aria-hidden": "true" }),
                    React.createElement("span", { "aria-hidden": "true" }))),
            React.createElement("div", { id: "navbarBasicExample", className: "navbar-menu" },
                React.createElement("div", { className: "navbar-start" },
                    React.createElement(NavBarItem, { item: "Home" }),
                    React.createElement(NavBarItem, { item: "Documentation" }),
                    React.createElement("div", { className: "navbar-item has-dropdown is-hoverable" },
                        React.createElement(NavBarLink, { link: "More" }),
                        React.createElement("div", { className: "navbar-dropdown" },
                            React.createElement(NavBarItem, { item: "About" }),
                            React.createElement(NavBarItem, { item: "Jobs" }),
                            React.createElement("hr", { className: "navbar-divider" }),
                            React.createElement(NavBarItem, { item: "Report an issue" })))),
                React.createElement("div", { className: "navbar-end" },
                    React.createElement("div", { className: "navbar-item" },
                        React.createElement("div", { className: "buttons" },
                            React.createElement("a", { className: "button is-primary" },
                                React.createElement("strong", null, "Sign up")),
                            React.createElement("a", { className: "button is-light" }, "Log in")))))));
    }
}
