//! Contains the web components and helper function that will be used for khadga.

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

#[wasm_bindgen]
impl MainNav {
  #[wasm_bindgen(constructor)]
  pub fn new() -> Result<Element, JsValue> {
    main_nav()
  }

  /// Add this type to the custom element registry
  /// 
  /// FIXME: This just doesn't work.  Not sure how to pass a function constructor to registry.define() as the 2nd
  /// argument.  You would think you could do something like registry.define("main-nav", &MainNav::new).  Wrapping this
  /// inside a Closure also did not work
  pub fn register() -> Result<(), JsValue> {
    let _registry = get_custom_registry();

    // FIXME: Unfortunately, this does not work.  When the custom element is called from document.create_element, an
    // error appears saying that the 2nd argument to define is not a constructor.  Looks like define requires a special
    // constructor function type.  I have tried several other approaches but nothing has worked.
    //  let fun = Closure::wrap(Box::new(move || {
    //    MainNav::new()
    //  }) as Box<dyn Fn() -> Result<Element, JsValue>>);

    //registry.define("main-nav", &MainNav::new);
    Ok(())
  }
}

pub fn main_nav() -> Result<Element, JsValue> {
    console::log_1(&"In MainNav::new".into());
    let doc = get_document();
    let element = doc.create_element("header")?;
    element.set_attribute("class", "main-nav")?;

    // Add the shadow DOM
    let shadow_mode = ShadowRootInit::new(ShadowRootMode::Open);
    let shadow_root = element.attach_shadow(&shadow_mode)?;

    let nav = doc.create_element("nav")?;
    shadow_root.append_child(&nav)?;
    // Add the other elements to the <nav>
    nav.insert_adjacent_html("afterbegin", r#"
        <ul>
          <li>Video Chat</li>
          <li>Blog</li>
          <li>Collaborative Documents</li>
        </ul>
    "#)?;

    Ok(element)
}

/// The main application
#[wasm_bindgen]
pub struct App {
  //nav: NavBar
}