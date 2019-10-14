//! Contains the web components that will be used for khadga.
//! 

use wasm_bindgen::prelude::*;
use web_sys::{
    Window,
    Document,
    CustomElementRegistry,
    HtmlElement,
    Element
};
use js_sys::{ Function };
//use web_sys::console::{ log_1 };

// Note that you can not make types pub in your extern
// Also note the path to the module.  First note that it doesn't use a relative path.  The path is
// assumed the root is the directory relative to the Cargo.toml file.
#[wasm_bindgen(raw_module = "/js/custom_elements.js")]
extern "C" {
    type NavBar;

    #[wasm_bindgen(constructor)]
    fn new() -> NavBar;
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

fn make_function(constructor: &str) -> Box<js_sys::Function> {
  let fun = js_sys::Function::new_no_args(&format!("return new {}()", constructor));
  Box::new(fun)
}

/// This is the main navigation site
/// 
/// From this component are the choices the user may make: 
/// - Video Chat
/// - Blog
/// - Collaborative documents
#[wasm_bindgen]
pub struct MainNav {
    //constructor: Box<js_sys::Function>
}

/// TODO: Need a macro to autogenerate the create_element, and append_node
#[wasm_bindgen]
impl MainNav {
  #[wasm_bindgen(constructor)]
  pub fn new() -> Result<Element, JsValue> {
    let doc = get_document();
    let element = doc.create_element("nav")?;
    // Add the other elements
    element.insert_adjacent_html("afterbegin", r#"
        <ul>
          <li>Video Chat</li>
          <li>Blog</li>
          <li>Collaborative Documents</li>
        </ul>
    "#)?;

    // Add the shadow DOM
    //let shadow_mode = ShadowRootInit::new(ShadowRootMode::Open);
    //element.attach_shadow(&shadow_mode);

    //let body = get_body();
    //body.append_child(&element)?;
    Ok(element)
  }

  pub fn register() -> Result<(), JsValue> {
    // Add to the custom element registry
    let registry = get_custom_registry();
    let fun = make_function("MainNav");
    registry.define("main-nav", &fun)?;
    Ok(())
  }
}

/// The main application
/// 
/// This will most often be used in a react-like way, where the index.html loads only a single
/// javascript file
#[wasm_bindgen]
pub struct App {
  //nav: NavBar
}

impl App {
    pub fn make_nav() {
        let _nav = NavBar::new();
        let _registry = get_custom_registry();
        
    }
}