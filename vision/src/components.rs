//! Contains the web components that will be used for khadga.
//! 

use wasm_bindgen::prelude::*;
use web_sys::{
    Window,
    Document,
    CustomElementRegistry
};

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
pub struct NavBar {
  
}

/// The main application
/// 
/// This will most often be used in a react-like way, where the index.html loads only a single
/// javascript file
pub struct App {

}