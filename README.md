# What is khadga?

khadga is a collaboration and creativity tool.  As an MVP it will focus on the following:

- WebRTC to do cam to cam video chats
- Chatroom to allow connected peers to communicate
- Text classification for chats
- Video image recognition (facial recognition)

To implement this, there are 3 main components:

- A backend, comprised of a rust warp server that handles the connection for WebRTC and websockets
- A frontend, which is a webassembly based SPA that will contain the UI for the session
- A mongodb database to store chats, documents and (public) keys
- tensorflow for modeling and training

## Backend

The backend is a rust server written in warp.  Since async-await is still very new, this is all
very beta.  Because async-await is so new,  the warp  framework just added  async-await in their master 
branch.

## Frontend

The front end is rust that compiles down to webassembly via the wasm-pack tool.  It does not make
use of a virtual DOM, since the current projects that can do thit have aVDOM still require a nightly
rust toolchain.

## Building

Eventually a build.rs script will be created to tie everything together, but  currently, the front end
core (ie vision) needs to be built separately.  In other words, just running `cargo build` is not
sufficient.

### Building vision

Do the following:

- cd vision
- npm run build

This will run the npm script which in turn calls webpack, which in turn calls the WasmPAck plugin. As you
can see, we aren't calling `cargo` directly.  However it does get called indirectly.

To test the code, you can run:

```
npm start
```

This will invoke a webpack dev server to host the generated front end code.  Alternatively, you can build
and start khadga (the backend part).

### Building khadga (the backend)

Do the following:

- cd khadga
- 