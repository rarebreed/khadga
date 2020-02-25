# What is khadga?

Visit [khadga.app](https://khadga.app)

Also, [read the book][-book] [In Progress!]

khadga is a tool to experiment with NLP and computer vision.  It offers a chat message based service
(think slack, gitter, discord, etc) along with a webcam interface.  The purpose of this is to
get data for both training and eventually for model prediction.

The second part of khadga is to do real-time analytics on the data that is coming in.  There are
two primary learning tasks:

- NLP to do text classification or semantic analysis
- Video image recognition and object tracking (facial recognition)

## Components

To implement this, there are 4 main components:

- A backend, comprised of a rust warp server that handles the connection for WebRTC and websockets
- A frontend, which is a react based SPA that will contain the UI for the session
- A cloud firestore database to store chats, documents and (public) keys
- A webassembly library to assist tensorflow using wasm-bindgen

### Backend: khadga

The backend is a rust server written in warp.  It will support websockets for several purposes:

- real time chat messages
- WebRTC for video streams
- mqtt (over websockets) so that IoT devices can pub-sub

The initial focus will be on websockets for chatting, and WebRTC.  In the future, khadga can act as
another mqtt client that IoT devices can send data to.

### Frontend: vision

The front is a react + typescript based project that will act as the primary means for a human agent
to interact with.

### Firestore

Firestore will be used to store data for scenarios where we need to persist data as not all data might
be consumed and used in real time.

It will also be used for things like user accounts and logins.

### Webassembly library: noesis

This library (called noesis) will help with some heavy lifting and data crunching.  The ultimate goal
will be to port tensorflow to wasm, but this will take time.

## Building

Eventually a build.rs script will be created to tie everything together, but  currently, the front end
core (ie vision) needs to be built separately.  In other words, just running `cargo build` is not
sufficient.

### Building vision

Do the following:

- cd vision
- npm run build

This will run the npm script which in turn calls parcel, which in turn generates the bundle for us. 

To test the code, you can run:

```
npm run serve
```

This will invoke a dev server from parcel to host the generated front end code.  Alternatively, you can build
and start khadga (the backend part).

### Building khadga (the backend)

Do the following:

- cd khadga
- cargo build

### Building noesis

This project uses wasm-pack, so we will use it to build the library.


## Testing khadga

Simply run `cargo test` as usual

## Docker build

Although rust builds binaries, the server uses some files for configuration, not to mention the static files
for the html, js, and wasm code.  So, we will package everything up in a docker container.  While not strictly
necessary, it wouldn't be difficult to create a tarball of the vision/dist folder and the khadga binary, doing
it with a docker container does make a CI environment easier.

Plus, through docker compose we can set up the mongodb database dependency.  To facilitate this, there is a 
dockerfile that will generate the khadga backend server, and a docker-compose that will handle combining the
khadga backend with mongodb.

### Building through docker

There is a build.sh script will set everything up, including building the noesis webassembly
library, and the vision front end.  There are 2 ways to use the script:

```bash
./build.sh  # Will build all sub projects, and then do a docker build
./build.sh <CLUSTER_NAME> <ZONE> <PROJECT> <TAG>  # Will do above + auth docker with gcloud and push image to GCR
```

### Using docker-compose for testing

I find docker-compose easier for testing than using minikube.

After running the build.sh script, you can bring up the app by running:

```bash
sudo docker-compose up
```

Then in your browser, you can go to http://localhost:7001

From there, you can play around with the application as it develops.

## Using kubernetes

Ultimately, khadga will be deployed as a GKE app, thus, it makes sense to do testing and deployment
from kubernetes.

[-book]: https://rarebreed.github.io/khadga/