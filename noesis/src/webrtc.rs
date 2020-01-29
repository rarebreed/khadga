use wasm_bindgen::prelude::*;
use crate::utils;

#[wasm_bindgen]
pub fn get_web_cam() {
	let _document = utils::get_document();
	
}