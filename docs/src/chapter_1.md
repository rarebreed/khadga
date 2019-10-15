# Introduction to khadga

This book is a small guide on how to create a web application using webassembly generated from rust.  It will take you
from knowing nothing about how to create wasm to how to generate both the front and back end code for your app.

The application that is generated here is a small chat application that will set up WebSocket connections between two
or more clients and the central web server.

If you're wondering where the name khadga comes from, it's a Sanskrit word meaning sword.  It is often referred to in
Hinduism, Jainism or Buddhism as the sword that cuts away illusion.

## What you will learn

This guide will walk you through everything required to develop, test and deploy both the front and backend application.
This includes:

- How to write a (bleeding edge) asynchronous server using rust's hyper
- How to use wasm-bindgen, web-sys and js-sys crates to create a single page web app
- How to serve your single page app from the async web server
- How to deploy your app to Openshift Online using docker and source-2-image
- How to set up unit and integration tests for the front and back end
- How to set up a CI pipeline between your deployment and your tests

## Prerequisites

This guide will cover how to scaffold and generate the initial wasm-pack code as well as a basic asynchronous web server
but it assumed that the reader is already familiar with:

- basic rust
- basic html
- basic css
- basics of docker

The reader's rust skills should be at a basic level.  One of the goals of the book is to explain some of the more tricky
rust concepts (or at least tricky to the author).  A basic understanding of rust ownership and lifetimes, and how
closures work will be required.  Understanding how Traits work, especially AsRef and From/Into will also be useful. The
async/await portions will be described in detail however.

The reader should have a basic level of HTML5 understanding.  This includes knowing what the DOM is and the basics of
common tags.  Most of the front end will be calling the web-sys bindings to the Web APIs, so it is useful but not
required to know javascript.  Because we are creating a single page app, knowledge of CSS will be useful, as the book
will not spend a lot of time explaining much of the CSS content.

For deployment, we will be using Openshift Online.  There is a free tier available and you can use this to deploy the
application.  In order to get the server to the cloud, we will need to create a container and therefore a docker image.
This will not be advanced, but there will not be a lot of explanation of what the docker file does.

## Caveats

The biggest caveat is the author is new to this himself.  The decision to write the book was to help others so they do
not have to learn the hard way like the author did.  Also, the author is at a basic to intermediate level understanding
of rust.  There could very well be a better way to write the code and if so, please make a PR and contribute!

The second caveat was that this project made an opinionated stance on the technology used.  First and foremost was the
desire to use the new async/await syntax.  This lead to several _problems_.  For example, since async/await is still
only available in beta or nightly toolchains, most of the web frameworks still don't use the new syntax.

Another decision was to use as few libraries and especially frameworks as possible.  Partially, the choice was due to
frameworks not supporting the async/await syntax.  Another reason was simply to learn things the hard way.  While this
makes the code more tedious to write, it will also help illuminate for the reader how some things are done without the
help of a framework.

### Why not yew?

Seasoned developers might ask why yew was not used for this project.  The simple answer here is that there was a desire
to use wasm-bindgen, web-sys and js-sys crates to create the app.

The author has no working knowledge of yew, and it was considered initially.  Afterall, it seems to tick off a lot of
the right boxes:

- Built in virtual DOM
- Macros to generate JSX like code

However, yew is built on a crate called stdweb instead of wasm-bindgen, web-sys and js-sys.  The main difference is that
those libraries are created and maintained by the official Web Assembly Working Group.  It will therefore be more up to
date and have "official" support.  It was also designed to be language agnostic and the bindings are auto-generated from
the WebIDL schema.

### Why not percy?

There is another framework that looked promising called percy.  It also has a virtual DOM and macro generator to create
some JSX-like code. Unlike yew, it is using wasm-bindgen and web-sys and js-sys crates. The problem with percy is that
because of some of the macros, it required a nightly toolchain.

Although nightly is great for individual learning and experimentation, it's not the best for teaching others.  The
brittleness of nightly means that what may compile one day for one person may not compile for another person (or the 
same person!) on another day.  It can also be hard sometimes to find a nightly build that allows all dependency crates
to be built successfully.