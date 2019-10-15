export class NavBar extends HTMLElement {
    constructor() {
        super();
        let shadow = this.attachShadow({ mode: "open" });
    }
}
export const make_nav = () => {
    let nb = new NavBar();
    return nb;
};
