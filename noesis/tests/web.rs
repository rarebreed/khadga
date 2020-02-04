//! Test suite for the Web and headless browsers.

#![cfg(target_arch = "wasm32")]

use noesis::utils;
use wasm_bindgen_test::*;
use web_sys::console;

wasm_bindgen_test_configure!(run_in_browser);

#[wasm_bindgen_test]
fn pass() {
    assert_eq!(1 + 1, 2);
}

#[wasm_bindgen_test]
async fn test_list_media_devices() {
    let stream = utils::list_media_devices().await.expect("No media stream");

    assert!(true);
}

#[wasm_bindgen_test]
async fn test_get_media() {
    let stream = utils::get_media_stream();
    let s = stream.await.expect("Could not get future");
    assert!(true);
}
