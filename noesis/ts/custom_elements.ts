/**
 * Registers this class as custom element
 */
export const register_navbar = () =>  {
  let registry = new CustomElementRegistry();
  registry.define("nav-bar", class extends HTMLElement {
    constructor() {
      super();
    }
  });
}