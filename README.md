# What is khadga?

khadga is a collaboration and creativity tool.  As a MVP it will focus on the following:

- WebRTC to do cam to cam video chats
- Chatroom to allow connected peers to communicate
- Collaborative document editor (think etherpad lite)
- Blogging site

To implement this, there are 3 main components:

- A backend, comprised of a rust hyper server that handles the connection for WebRTC and websockets
- A frontend, which is a webassembly based SPA that will contain the UI for the session
- A mongodb database to store chats, documents and documents

## Backend

The backend is a rust server written in hyper.  Since async-await is still very new, this is all
very beta.  Because async-await is so new, the web servers still don't make use of it well, so the
least painful way to use async was to use hyper.

This means a lot of things that higher frameworks like actix or warp give you are not there, like
routing or TLS for example.