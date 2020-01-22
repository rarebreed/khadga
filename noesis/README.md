# vision

This is the Single Page App that will run client side on the user's browser.  It will handle:

- Virtual interaction (webcam + chat)
  - A canvas to show the connected clients webcams
  - An area for chat, including who is in the room
- Blogging section
- Shared documents
- Tensorflow.js layer application and modeling for facial recognition
- Tensorflow.js layer application and modeling for chat classification

This web app should use as much web assembly (via rust) as possible.
  
## Why not yew?

Although yew looks really interesting, it's using the stdweb crate for most of its work.  Unfortunately
stdweb and wasm-bindgen are both attempting to do the same thing.  Although stdweb has a head start, it
has some disadvantages:

- It's slower than wasm-bindgen
- wasm-bindgen is the officially supported tool for wasm interop
  - So it should grow faster over time
- wasm-bindgen, at least in theory, is cross language capable since it autogenerates from web IDL

However, not using yew leads to some other problems,  Yew gives you quite a few things out of the box
which this project will have to find another way to do:

- Virtual DOM: there really isn't a mature one out there
  - dodrio is very experimental
  - percy requires macro magic and therefore has to be built with `nightly`
- Templating: something JSX-like
  - percy has this, but again, cant use it because of nightly
- Routing: not even sure if yew has this, but managing navigating for a SPA will be tricky

Ideally, I would like to use percy.  But the requirement for nightly is a deal breaker just because it is
so painful to get everything lined up right.  For the same reason, I can't use rocket for the backend.

### Shadow DOM vs. Virtual DOM

So, if we can't use yew, dodrio or percy, what can we do?  For one, we might actually be able to use
dodrio, even if it is experimental.  If stuff breaks I could always contribute PR's back to the project.

A second possibility is to roll my own.  There are some articles out there that describe how to implement
a VDOM.  It seems easy enough for a GC'ed language.  I'm not sure how much more difficult it would be to 
do in rust. Glancing at dodrio, it doesn't look like a non-trivial project.

So the final possibility is to not use a VDOM at all.  We could instead use a Shadow DOM along with Web
Components.  The Shadow DOM will help with performance, and also isolate styles.  It might make it tricky
to update across components however.  Nevertheless, I think this is the way to go.

### Templating

While it'd be nice to have some kind of JSX-like syntax to generate the Web Components, it's not strictly
necessary.  It would be a nice way to learn how to write a macro, but it might run into the same hygiene
issue that requires nightly.

Alternatively, a Builder pattern could be used

## How to install

```sh
npm install
```

## How to run in debug mode

```sh
# Builds the project and opens it in a new browser tab. Auto-reloads when the project changes.
npm start
```

## How to build in release mode

```sh
# Builds the project and places it into the `dist` folder.
npm run build
```

## How to run unit tests

```sh
# Runs tests in Firefox
npm test -- --firefox

# Runs tests in Chrome
npm test -- --chrome

# Runs tests in Safari
npm test -- --safari
```

## What does each file do?

* `Cargo.toml` contains the standard Rust metadata. You put your Rust dependencies in here. You must change this file with your details (name, description, version, authors, categories)

* `package.json` contains the standard npm metadata. You put your JavaScript dependencies in here. You must change this file with your details (author, name, version)

* `webpack.config.js` contains the Webpack configuration. You shouldn't need to change this, unless you have very special needs.

* The `js` folder contains your JavaScript code (`index.js` is used to hook everything into Webpack, you don't need to change it).

* The `src` folder contains your Rust code.

* The `static` folder contains any files that you want copied as-is into the final build. It contains an `index.html` file which loads the `index.js` file.

* The `tests` folder contains your Rust unit tests.
