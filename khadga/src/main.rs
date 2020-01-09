use warp::Filter;

use std::{collections::HashMap,
          sync::{Arc,
                 Mutex}};

#[tokio::main]
async fn main() {
    env_logger::init();

    // State for the chat will be maintained in a HashMap  of users to websocket connections
    // We store our connection state inside a Mutex inside an Arc.  The inner Mutex is needed,
    // Since the task executor running in warp is multithreaded.  Each time a connection is made,
    // it could be handled on a task running in a separate thread.  The Mutex ensures that only
    // one threa at a time van update the HashMap.
    //
    // The Arc is to allow sharing of the Mutex between the threads
    let conn_users = Arc::new(Mutex::new(HashMap::<String, String>::new()));

    // This is the main entry point to the application
    // Notr the relative path.  The path is relative to where you are executing/launching khadga
    // from.  In this case, if we run `cargo run`, this path will work.  However, if we run like
    // `./target/debug/khadga`  it will not.  But, if we cd to target, then run `./debug/khadga`
    // it will work.  This is confusing, and something to keep in mind.
    let app = warp::path("start").and(warp::fs::dir("../vision/dist"));

    // TODO: Need a login handler and a websocket endpoint
    // When a user logs in, they will be given an auth token which can be used to hain access to
    // chat and video for as long as the session maintains activity

    warp::serve(app).run(([127, 0, 0, 1], 7001)).await;
    println!("Ended service");
}
