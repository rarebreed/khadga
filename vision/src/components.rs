//! Contains the web components that will be used for khadga.
//! 

use wasm_bindgen::prelude::*;
use web_sys::{
    Window,
    Document,
    CustomElementRegistry
};
use js_sys::{ Function };
//use web_sys::console::{ log_1 };

// Note that you can not make types pub in your extern
// Also note the path to the module.
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

/// Defines a navigation bar that can be used for top-level navigation of the application
pub fn main_nav() {
    let doc = get_document();

    if let Ok(elem) = doc.create_element("nav") {
        let he: JsValue = JsValue::from(elem);
        let fun = Box::new(Function::from(he));

        let registry = get_custom_registry();
        let register = registry.define("main-nav", &fun);
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