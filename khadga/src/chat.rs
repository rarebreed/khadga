// #![deny(warnings)]
use crate::message::{self,
                     ConnectionMsg,
                     MessageEvent};
use std::{collections::HashMap,
          sync::Arc};

use futures::{FutureExt,
              StreamExt};
use log::{info, error, debug};
use serde_json;
use tokio::sync::{mpsc,
                  Mutex};
use warp::{filters::BoxedFilter,
           ws::{Message,
                WebSocket,
                Ws},
           Filter,
           Reply};

/// Our state of currently connected users.
///
/// - Key is their id
/// - Value is a sender of `warp::ws::Message`
type Users = Arc<Mutex<HashMap<String, mpsc::UnboundedSender<Result<Message, warp::Error>>>>>;

pub async fn chat(users: Users) -> BoxedFilter<(impl Reply,)> {
    let users2 = warp::any().map(move || users.clone());

    let chat = warp::path("chat")
        .and(warp::ws())
        .and(warp::path::param().map(|username: String| username))
        .and(users2)
        .map(|ws: Ws, username: String, users: Users| {
            info!("User {} starting chat", username);
            ws.on_upgrade(move |socket| user_connected(socket, users, username))
        });
    chat.boxed()
}

/// Return a `Future` that is basically a state machine managing this specific user's connection.
///
/// This function handles the websocket connection for a connected user.  As a user connects, they
/// will be added to the users shared Mutex. A connection event will be sent to all other users to
/// notify them that a new user is connected. As long as the websocket stays open, a spawned async 
/// task will handle messages coming from the client's websocket.  When the client disconnects, that
/// client/user will be removed from the shared map and a disconnect event will be sent.
pub async fn user_connected(ws: WebSocket, users: Users, username: String) {
    info!("new chat user: {}", username);

    // Split the socket into a sender and receive of messages.
    let (user_ws_tx, mut user_ws_rx) = ws.split();
    debug!("{}: Split the websocket", username);

    // Use an unbounded channel to handle buffering and flushing of messages
	// to the websocket
	// FIXME:  I dont think we should use an unbounded channel or we can run into memory pressure
	// issues.  Might need to do some profiling, but since rust's async uses a polling method
	// we automatically get backpressure support.
    let (tx, rx) = mpsc::unbounded_channel();
    debug!("{}: Created the mpsc channels", username);

    // Create an async task that handles the messages streaming from rx by forwarding them
	// to user_tx.  This will drive the Stream backed by rx to send values to user_tx until
    // rx is exhausted.  This is how we send messages from khadga to the client
    debug!("{}: Setting up async task to forward rx to user_ws_tx", username);
    tokio::task::spawn(rx.forward(user_ws_tx).map(|result| {
        if let Err(e) = result {
            error!("websocket send error: {}", e);
        } else {
            info!("Forwarded message from rx to user_ws_tx");
        }
    }));

    let copy_uname = username.clone();
    // Save the sender in our list of connected users.
    
    // We created a nested scope here so that we release the lock.  If we don't, the call to
    // get_users will deadlock waiting for the lock here to release.
    { 
        users.lock().await.insert(copy_uname, tx);
    }
    let user_list = get_users(&users).await;

    // Send back a list of connected users.  Remember that tx is connected to rx.  Earlier
    // we forwarded rx channel to user_tx.  So anything we send via tx2 will also be received
    // by rx, and therefore will be sent over to user_tx and then over the websocket
    let conn_list = ConnectionMsg::new(user_list);
    let connect_msg =
        message::Message::new(username.clone(), vec![], MessageEvent::Connect, conn_list);

    // Send a connection event to each connected user
    // FIXME:  I think we can put this in the loop above.  No need to clone again
    debug!("{}: Sending connected event to all connected users", username);
    let event_users = users.clone();
    {
        let list = event_users.lock().await;
        for (user, tx) in list.iter() {
            debug!("Sending connect event to {}", user);
            let connect_msg_str: String =
                serde_json::to_string(&connect_msg).expect("Unable to serialize to Message");
            tx.send(Ok(Message::text(connect_msg_str)))
                .expect("Failed to send to tx");
        }
    }
    debug!("{}: Done sending connected event messages", username);

    // Make an extra clone to give to our disconnection handler...
    let users2 = users.clone();

    // Every time the user sends a message send it out
    info!("{}: listening for messages", username);
    while let Some(result) = user_ws_rx.next().await {
        let copy_name = username.clone();
        let msg = match result {
            Ok(msg) => msg,
            Err(e) => {
                error!("websocket error(uid={}): {}", copy_name, e);
                break;
            }
        };
        // FIXME: Each message will have encoded within it, a list of recipients
        user_message(copy_name, msg, &users).await;
    }
    info!("{} has disconnected", username);

    // user_ws_rx stream will keep processing as long as the user stays
    // connected. Once they disconnect, then...
    let copy_name = username.clone();
    user_disconnected(copy_name, &users2).await;
}

async fn user_message(my_id: String, msg: Message, users: &Users) {
    // Skip any non-Text messages...
    let msg = if let Ok(s) = msg.to_str() {
        s
    } else {
        debug!("Unable to process message");
        return;
    };

    let _mesg: message::Message<String> = serde_json::from_str(msg).expect("Unable to parse");

    let new_msg = format!("{}", msg);

    info!("From {} got message {}", my_id, new_msg);

    // New message from this user, send it to everyone else (except same uid)...
    // FIXME: Send only to the recipients in _mesg.
    for (_, tx) in users.lock().await.iter_mut() {
        if let Err(_disconnected) = tx.send(Ok(Message::text(new_msg.clone()))) {
            // The tx is disconnected, our `user_disconnected` code
            // should be happening in another task, nothing more to
            // do here.
        }
    }
}

async fn get_users(users: &Users) -> Vec<String> {
    debug!("Creating connected user list");
    let mut user_list: Vec<String> = vec![];
    debug!("Acquiring lock");
    let list = users.lock().await;
    debug!("Connected Users:");

    for (key, _) in list.iter() {
        info!("{}", key);
        user_list.push(key.clone());
    }

    let mut _user_str = user_list.iter().fold("".into(), |mut acc: String, next| {
        acc = acc + &next + "\n";
        acc
    });
    debug!("Returning list of connected users");
    user_list
}

async fn user_disconnected(my_id: String, users: &Users) {
    error!("good bye user: {}", my_id);

    {
        // We scope the lock on users here.  If we don't, the call to get_users will block
        let mut list = users.lock().await;
        list.remove(&my_id);
    }

    // Send message to all other users that user has disconnected
    // Send back a list of connected users.  Remember that tx is connected to rx.  Earlier
    // we forwarded rx channel to user_tx.  So anything we send via tx2 will also be received
    // by rx, and therefore will be sent over to user_tx and then over the websocket
    let user_list = get_users(&users).await;  // users.lock acquired and released here

    let conn_list = ConnectionMsg::new(user_list);
    let connect_msg =
        message::Message::new(my_id.clone(), vec![], MessageEvent::Disconnect, conn_list);

    for (user, tx) in users.lock().await.iter() {
        if my_id != *user {
            debug!("Sending connection event to {}", user);
            let connect_msg_str: String =
                serde_json::to_string(&connect_msg).expect("Unable to serialize to Message");
            tx.send(Ok(Message::text(connect_msg_str)))
                .expect("Failed to send to tx");
        }
    }
}
