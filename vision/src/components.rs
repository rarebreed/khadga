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

pub fn create_shadow_css_link(sheet: &str) -> Result<Element, JsValue> {
    let doc = get_document();
    let link_elem = doc.create_element("link")?;
    link_elem.set_attribute("rel", "stylesheet")?;
    link_elem.set_attribute("href", sheet)?;
    Ok(link_elem)
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

  /// Add this as a custom web component type to the custom element registry
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
    element.set_attribute("id", "main-header")?;


    // Add the shadow DOM
    let shadow_mode = ShadowRootInit::new(ShadowRootMode::Open);
    let shadow_root = element.attach_shadow(&shadow_mode)?;

    let nav_container = doc.create_element("div")?;
    nav_container.set_attribute("id", "logo-container")?;

    nav_container.insert_adjacent_html("afterbegin", r#"
      <a href="index.html" id="logo">
        khadga
      </a>
    "#)?;
    shadow_root.append_child(&nav_container)?;

    let nav = doc.create_element("nav")?;
    nav.set_attribute("class", "main-nav")?;

    // Add the other elements to the <nav>
    nav.insert_adjacent_html("afterbegin", r#"
        <ul class="main-nav__items">
          <li class="main-nav__item">Video Chat</li>
          <li class="main-nav__item">Blog</li>
          <li class="main-nav__item">Collaborative Documents</li>
        </ul>
    "#)?;
    shadow_root.append_child(&nav)?;

    // Add shadow CSS
    let link = create_shadow_css_link("shadow.css")?;
    nav.append_child(&link)?;

    Ok(element)
}

/// The main application
#[wasm_bindgen]
pub struct App {
  //nav: NavBar
}