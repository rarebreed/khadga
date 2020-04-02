// #![deny(warnings)]
use crate::message::{self,
                     CommandRequestMsg,
                     ConnectionMsg,
                     Message as KMessage,
                     MessageEvent::{self,
                                    CommandRequest}};
use std::{collections::HashMap,
          sync::Arc};

use futures::{FutureExt,
              StreamExt};
use log::{debug,
          error,
          info};
use serde_json;
use tokio::{sync::{mpsc,
                   Mutex},
            time::Duration};
use warp::{ws::{Message,
                WebSocket}};

/// Our state of currently connected users.
///
/// - Key is their id
/// - Value is a sender of `warp::ws::Message`
pub type Users = Arc<Mutex<HashMap<String, mpsc::UnboundedSender<Result<Message, warp::Error>>>>>;

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
    // rx is exhausted.  This is how we send messages from khadga to the client (eg it goes
    // tx -> rx -> user_ws_tx)
    debug!(
        "{}: Setting up async task to forward rx to user_ws_tx",
        username
    );
    tokio::task::spawn(rx.forward(user_ws_tx).map(|result| {
        if let Err(e) = result {
            error!("websocket send error: {}", e);
        } else {
            info!("Forwarded message from rx to user_ws_tx");
        }
    }));

    // Send a ping message every 10 seconds.  If user has disconnected, they wont be in the shared
    // map, and the while loop will break
    let mut interval = tokio::time::interval(Duration::from_millis(10000));
    let loop_users = users.clone();
    let loop_uname = username.clone();

    // We avoid acquiring the lock too long in the loop by grabbing it and then at the end of the
    // if/else, we release the lock.  This does mean that if tx has a lot to send, the lock will be
    // acquired and might slow down others.
    tokio::task::spawn(async move {
        loop {
            interval.tick().await;
            if let Some(user_tx) = loop_users.lock().await.get(&loop_uname) {
                let mut msg = CommandRequestMsg::default();
                msg.cmd.id = "khadga-1".into(); // FIXME: append timestamp
                let cmsg =
                    KMessage::new("khadga".into(), vec![], MessageEvent::CommandRequest, msg);
                let cmsg = serde_json::to_string(&cmsg).expect("Could not parse to CommandMsg");
                match user_tx.send(Ok(Message::text(cmsg))) {
                    Ok(_) => {}
                    _ => error!("Unable to send ping message"),
                };
            } else {
                break;
            }
        }
    });

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
    let connect_msg = KMessage::new(username.clone(), vec![], MessageEvent::Connect, conn_list);

    // Send a connection event to each connected user
    // FIXME:  I think we can put this in the loop above.  No need to clone again
    debug!(
        "{}: Sending connected event to all connected users",
        username
    );
    let event_users = users.clone();
    {
        let list = event_users.lock().await;
        for (user, tx) in list.iter() {
            debug!("Sending connect event to {}", user);
            let conn_msg_str =
                serde_json::to_string(&connect_msg).expect("Unable to serialize to Message");
            tx.send(Ok(Message::text(conn_msg_str)))
                .expect("Failed to send to tx");
        }
    }
    debug!("{}: Done sending connected event messages", username);

    // Every time the user sends a message handle it.  Note that since we are calling .await here
    // and we are not in a tokio task, this will block here.  We won't proceed to the
    // user_disconnected until the connection breaks, which will cause the let Some(result) to
    // not be true, thus breaking out of the loop
    info!("{}: listening for messages", username);
    while let Some(result) = user_ws_rx.next().await {
        let copy_name = username.clone();
        let msg = match result {
            Ok(msg) => msg,
            Err(e) => {
                error!("websocket error(uid={}): {}", copy_name, e);
                continue;
            }
        };
        user_message(copy_name, msg, &users).await;
    }
    info!("{} has disconnected", username);

    // user_ws_rx stream will keep processing as long as the user stays
    // connected. Once they disconnect, then...
    // Make an extra clone to give to our disconnection handler...
    let copy_name = username.clone();
    let users2 = users.clone();
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
    // debug!("Raw Message from {} is {:#?}", my_id, msg);

    let mesg: message::Message<String> = serde_json::from_str(msg).expect("Unable to parse");
    let message: String = match mesg.event_type {
        CommandRequest => {
            let cmd_body: CommandRequestMsg<String> =
                serde_json::from_str(&mesg.body).expect("Unable to deserialize");
            debug!("{:#?}", cmd_body.cmd);
            // TODO: Do something with the request and send back CommandReply
            if cmd_body.cmd.ack {
                info!("From {} got args {}", my_id, cmd_body.args);
            } else {
                return;
            }

            let cmd_msg = mesg.from(cmd_body);
            serde_json::to_string(&cmd_msg).expect("Unable to serialize to string")
        }
        // TODO: match on other event_types
        _ => format!("{}", msg),
    };

    // debug!("From {} got message {}", my_id, message);

    // New message from this user, send it to everyone else (except same uid)...
    // FIXME: Send only to the recipients in _mesg.
    for (usr, tx) in users.lock().await.iter_mut() {
        if mesg.recipients.contains(usr) {
            info!("Sending message to {}", usr);
            if let Err(_disconnected) = tx.send(Ok(Message::text(message.clone()))) {
                // The tx is disconnected, our `user_disconnected` code should be happening in
                // another task, nothing more to do here.
            }
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
    let user_list = get_users(&users).await; // users.lock acquired and released here

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