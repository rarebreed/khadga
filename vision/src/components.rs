//! Contains the web components and helper function that will be used for khadga.
//! 

use wasm_bindgen::prelude::*;
use web_sys::{
    Window,
    Document,
    CustomElementRegistry,
    HtmlElement,
    Element,
    ShadowRootInit,
    ShadowRootMode,
    console
};
use wasm_bindgen::JsCast;

// Note the path to the module.  First note that it doesn't use a relative path.  The path is
// assumed the root is the directory relative to the Cargo.toml file.
#[wasm_bindgen(raw_module = "/js/custom_elements.js")]
extern "C" {
    type NavBar;

    #[wasm_bindgen]
    fn make_nav() -> NavBar;
}

#[wasm_bindgen]
pub fn get_window() -> Window {
    let window = web_sys::window().expect("Did not have a global window object");
    window
}

#[wasm_bindgen]
pub fn get_document() -> Document {
    let window = get_window();
    window.document().expect("window should have a document object")
}

#[wasm_bindgen]
pub fn get_custom_registry() -> CustomElementRegistry {
    let window = get_window();
    window.custom_elements()
}

#[wasm_bindgen]
pub fn get_body() -> HtmlElement {
    let doc = get_document();
    let body = doc.body().expect("document must have a body");
    body
}

/// This is the main navigation site
/// 
/// From this component are the choices the user may make: 
/// - Video Chat
/// - Blog
/// - Collaborative documents
#[wasm_bindgen]
pub struct MainNav { }

/// TODO: Need a macro to autogenerate the create_element, and append_node
#[wasm_bindgen]
impl MainNav {
  #[wasm_bindgen(constructor)]
  pub fn new() -> Result<Element, JsValue> {
    main_nav()
  }

  /// Add this type to the custom element registry
  /// 
  /// TODO: This should only be called once.  Might need to create a static mutable to get and set if it's registered
  pub fn register() -> Result<(), JsValue> {
    let registry = get_custom_registry();

    // FIXME: Unfortunately, this does not work.  When the custom element is called from document.create_element, an
    // error appears saying that the 2nd argument to define is not a constructor.
    let fun = Closure::wrap(Box::new(move || {
      MainNav::new()
    }) as Box<dyn Fn() -> Result<Element, JsValue>>);
    registry.define("main-nav", fun.as_ref().unchecked_ref())?;
    Ok(())
  }
}

pub fn main_nav() -> Result<Element, JsValue> {
    console::log_1(&"In MainNav::new".into());
    let doc = get_document();
    let element = doc.create_element("nav")?;

    // Add the other elements to the <nav>
    element.insert_adjacent_html("afterbegin", r#"
        <ul>
          <li>Video Chat</li>
          <li>Blog</li>
          <li>Collaborative Documents</li>
        </ul>
    "#)?;

    // Add the shadow DOM
    let shadow_mode = ShadowRootInit::new(ShadowRootMode::Open);
    let _shadow_root = element.attach_shadow(&shadow_mode)?;

    Ok(element)
}

/// The main application
#[wasm_bindgen]
pub struct App {
  //nav: NavBar
}