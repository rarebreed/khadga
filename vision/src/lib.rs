pub mod components;
use components::{ MainNav };
use wasm_bindgen::prelude::*;
use web_sys::{ ElementCreationOptions };

// When the `wee_alloc` feature is enabled, this uses `wee_alloc` as the global
// allocator.
//
// If you don't want to use `wee_alloc`, you can safely delete this.
#[cfg(feature = "wee_alloc")]
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;


// This is like the `main` function, except for JavaScript.
#[wasm_bindgen(start)]
pub fn main_js() -> Result<(), JsValue> {
  // Use `web_sys`'s global `window` function to get a handle on the global window object.
  // For now, we are just going to use the DOM directly
  let window = web_sys::window().expect("no global `window` exists");
  let document = window.document().expect("should have a document on window");
  let body = document.body().expect("document should have a body");

  // Manufacture the element we're gonna append
  let val = document.create_element("p")?;
  val.set_inner_html("Hello from Rust!");

  body.append_child(&val)?;

  MainNav::register()?;
  let mut options = ElementCreationOptions::new();
  options.is("main-nav");
  let nav = document.create_element_with_element_creation_options("main-nav", &options)?;
  body.append_child(&nav)?;

  Ok(())
}
