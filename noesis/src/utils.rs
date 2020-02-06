use wasm_bindgen::{prelude::*,
                   JsCast};
use wasm_bindgen_futures::JsFuture;
use web_sys::{console,
              Document,
              HtmlElement,
              MediaDeviceInfo,
              MediaStream,
              MediaStreamConstraints,
              Navigator,
              Window};

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

/// Returns a Navigator object
#[wasm_bindgen]
pub fn get_navigator() -> Navigator {
    let window = get_window();
    let nav = window.navigator();
    nav
}

/// Retrieves MediaStream from the navigator
///
/// Since get_user_media() returns a Result<Promise, JsValue>, we extract it from the Result and
/// then use JsFuture::from() to turn it into a rust Future.  To pull out the data from the Future
/// we use the await to wait until it has resolved.
#[wasm_bindgen]
pub async fn get_media_stream() -> Result<MediaStream, JsValue> {
    let navigator = get_navigator();
    let media_devs = navigator.media_devices()?;

    let mut constraints = MediaStreamConstraints::new();
    constraints.video(&js_sys::Boolean::from(true));

    match media_devs.get_user_media_with_constraints(&constraints) {
        Ok(dev) => {
            let fut = JsFuture::from(dev).await?;
            let media_stream = MediaStream::from(fut);
            Ok(media_stream)
        }
        Err(e) => Err(e),
    }
}

#[wasm_bindgen]
pub async fn list_media_devices() -> Result<js_sys::Array, JsValue> {
    let navigator = get_navigator();
    let media_devs = navigator.media_devices()?;

    let devices = js_sys::Array::new();
    match media_devs.enumerate_devices() {
        Ok(devs) => {
            let media_device_info_arr = JsFuture::from(devs).await?;

            let iterator = js_sys::try_iter(&media_device_info_arr)?
                .ok_or_else(|| {
                    console::log_1(&"Could not convert to iterator".into());
                })
                .expect("Unable to convert to array");

            for device in iterator {
                let device = device?;
                let device_info = device.dyn_into::<MediaDeviceInfo>()?;

                let stringified =
                    js_sys::JSON::stringify(&device_info.to_json()).unwrap_or("".into());
                console::log_1(&stringified);
                devices.push(&device_info);
            }

            Ok(devices)
        }
        Err(e) => Err(e),
    }
}
