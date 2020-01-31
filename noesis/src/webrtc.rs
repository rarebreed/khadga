use crate::utils;
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn get_web_cam() {
    let _document = utils::get_document();
}
