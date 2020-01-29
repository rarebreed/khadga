
use wasm_bindgen::prelude::*;
use wasm_bindgen_futures::JsFuture;
use web_sys::{Document,
              HtmlElement,
              Window,
              Navigator,
              MediaStream};

pub fn set_panic_hook() {
    // When the `console_error_panic_hook` feature is enabled, we can call the
    // `set_panic_hook` function at least once during initialization, and then
    // we will get better error messages if our code ever panics.
    //
    // For more details see
    // https://github.com/rustwasm/console_error_panic_hook#readme
    #[cfg(feature = "console_error_panic_hook")]
    console_error_panic_hook::set_once();
}

#[wasm_bindgen]
pub fn get_window() -> Window {
    let window = web_sys::window().expect("Did not have a global window object");
    window
}

#[wasm_bindgen]
pub fn get_document() -> Document {
    let window = get_window();
    window
        .document()
        .expect("window should have a document object")
}

#[wasm_bindgen]
pub fn get_body() -> HtmlElement {
    let doc = get_document();
    let body = doc.body().expect("document must have a body");
    body
}

/// Returns 
#[wasm_bindgen]
pub fn get_navigator() -> Navigator {
  let window = get_window();
  let nav = window.navigator();
  nav
}

#[wasm_bindgen]
pub async fn get_media_stream() -> Result<MediaStream, JsValue> {
  let navigator = get_navigator();
  let media_devs = navigator.media_devices()?;
  match media_devs.get_user_media() {
    Ok(dev) => {
      let fut = JsFuture::from(dev).await?;
      let media_stream = MediaStream::from(fut);
      Ok(media_stream)
    },
    Err(e) => Err(e)
  }
}

