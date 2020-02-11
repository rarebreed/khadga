//! # AuthN and authZ for site
//!
//! We are not getting fancy here...yet.  Ideally we should use something like keycloak + 2fa
//! For now, we are going to be less user friendly, and use simple password for authentication.
//!
//! ## Registration
//!
//! When the user first registers, they will supply their email and a username/password pair.
//! The username must be unique, so we will check the database if this username exists.  If not,
//! then we will map the username, password and email to a document in the database.  An email will
//! be generated and sent to the user's email address confirming registration.
//!
//! ### User types
//!
//! Currently, there will only be one user type.  In the future, there may other user types.  For
//! example, there may be a free tier and a premium tier.
//!
//! ## Logging in
//!
//! When a user has registered successfully, they can then log in with their username and password.
//! When the form is submitted, we simply look up the username in the database.  We allow only 3
//! failed attempts.  The user must then wait 1 hour, or change password via email.
//!
//! This means we must keep track of login attempts.  In the future, we may also track the IP
//! address and/or user agent as a means to further secure.
//!
//! Once authenticated, a JWT will be created.  This token will expire in 15 minutes.  All requests
//! from the agent (the user is using) will pass this JWT token around.

use crate::{data::User,
            db::{add_user,
                 get_user,
                 validate_user_pw}};
use log::{error, info};
use serde::{Deserialize,
            Serialize};
use warp::{filters::BoxedFilter,
           http::{Response,
                  StatusCode},
           Filter,
           Reply,
           ws};
use tokio::sync::{mpsc};
use futures::{Future, FutureExt, StreamExt, future,
              SinkExt};
use std::{sync::{Arc, Mutex},
          collections::{HashMap}};
use super::message::{Message};

type Users = Arc<Mutex<HashMap<String, 
                               mpsc::UnboundedSender<Result<ws::Message, warp::Error>>>>>;

#[derive(Serialize, Deserialize, Debug)]
pub struct LoginParams {
    uname: String,
    psw: String,
}

#[derive(Deserialize, Serialize, Debug)]
pub struct RegisterParams {
    uname: String,
    psw: String,
    email: String,
}

pub fn register() -> BoxedFilter<(impl Reply,)> {
    let route = warp::post()
        .and(warp::path("register"))
        .and(warp::body::json())
        .map(|reg_params: RegisterParams| {
            println!("{:#?}", reg_params);

            let builder = Response::builder();
            let reply = match get_user("khadga", &reg_params.uname) {
                Some((_, users)) if users.len() >= 1 => {
                    error!("More than one user with name of {}", reg_params.uname);
                    builder
                        .status(StatusCode::from_u16(409).unwrap())
                        .body("User already exists")
                }
                Some((coll, users)) if users.is_empty() => {
                    // Add user to db
                    let user = User::new(reg_params.uname, reg_params.psw, reg_params.email);

                    match add_user(&coll, user) {
                        Err(_) => builder.status(StatusCode::from_u16(500).unwrap()).body(""),
                        _ => builder.status(StatusCode::OK).body("Added user"),
                    }
                }
                _ => {
                    builder
                        .status(StatusCode::from_u16(500).unwrap())
                        .body("Unable to retrieve data from database")
                }
            };

            reply
        });
    route.boxed()
}

/// FIXME: This automatically accepts all users.
/// 
/// Route for /chat/:username
/// 
/// This should be converted to a 'chat' endpoint, and login will do the actual authentication
pub fn chat(users: Users) -> BoxedFilter<(impl Reply,)> {
    let users2 = warp::any().map(move || users.clone());

    let chat = warp::path("chat")
        .and(ws())
        .and(warp::path::param().map(|username: String| username))
        .and(users2)
        .map(|ws: ws::Ws, username: String, users: Users| {
            println!("User {} starting chat", username);
            // TODO: Need a login handler and a websocket endpoint
            // When a user logs in, they will be given an auth token which can be used
            // to hain access to chat and video for as long as the session maintains activity
            // let builder = Response::builder();
            // let user = User::new(login_params.uname, login_params.psw, "".into());
            ws.on_upgrade(move |socket| {
                connect_user(socket, users, username)
                  .map(|result| result.unwrap())
            })
        });
    chat.boxed()
}

pub fn login() -> BoxedFilter<(impl Reply,)> {
    let login = warp::post()
        .and(warp::path("login"))
        .and(warp::body::json())
        .map(|login_params: LoginParams| {
            println!("{:#?}", login_params);
            // TODO: Need a login handler and a websocket endpoint
            // When a user logs in, they will be given an auth token which can be used
            // to hain access to chat and video for as long as the session maintains activity
            let builder = Response::builder();
            let user = User::new(login_params.uname, login_params.psw, "".into());
            match validate_user_pw("khadga", &user) {
                Ok((_, true)) => {
                    // TODO: Provide a JWT token we can use for other endpoints like `chat`
                    builder.status(StatusCode::OK).body("User authenticated")
                },
                _ => {
                    builder
                        .status(StatusCode::from_u16(403).unwrap())
                        .body("Unable to retrieve data from database")
                }
            }
        });
    login.boxed()
}

pub fn connect_user(
    ws: ws::WebSocket,
    users: Users,
    username: String,
) -> impl Future<Output = Result<(), ()>> {
    // Split the socket into a sender and receive of messages.
    let (user_tx, user_rx) = ws.split();

    // Use an unbounded channel to handle buffering and flushing of messages
    // to the websocket
    let (tx, rx) = mpsc::unbounded_channel();
    let tx2 = tx.clone();

    // Create an async task that handles the messages streaming from rx by forwarding them
    // to user_tx.  This will drive the Stream backed by rx to send values to user_tx until
    // rx is exhausted
    tokio::task::spawn(rx.forward(user_tx).map(|result| {
        if let Err(e) = result {
            eprintln!("websocket send error: {}", e);
        }
    }));

    // Save the sender in our list of connected users state
    let user_copy = username.clone();
    users.lock().unwrap().insert(user_copy, tx);

    let mut user_list: Vec<String> = vec![];
    let users2 = users.clone();
    {
        let list = users2.lock().unwrap();
        info!("Connected Users:");
        
        for (key, _) in list.iter() {
            info!("{}", key);
            user_list.push(key.clone());
        }

        let mut _user_str = user_list
          .iter()
          .fold("".into(), |mut acc: String, next| {
            acc = acc + &next + "\n";
            acc
          });
    }
    
    // Send back a list of connected users.  Remember that tx is connected to rx.  Earlier
    // we forwarded rx channel to user_tx.  So anything we send via tx2 will also be received
    // by rx, and therefore will be sent over to user_tx and then over the websocket
    let connect_msg = Message::new(username.clone(), vec![], user_list);
    let connect_msg_str: String = serde_json::to_string(&connect_msg)
      .expect("Unable to serialize to Message");
    tx2.send(Ok(ws::Message::text(connect_msg_str))).expect("Failed to send to tx");
    
    // Every time the logged in user sends a message, send it to
    // all other users specified in the msg
    let copied_user = username.clone();
    let res = user_rx
        .for_each(move |msg| {
            let user_copy = copied_user.clone();
            user_message(user_copy, msg.unwrap(), &users);
            future::ready(())
        })
        // for_each will keep processing as long as the user stays
        // connected. Once they disconnect, then...
        .then(move |result| {
            let user_copy = username.clone();
            user_disconnected(user_copy, &users2);
            future::ok(result)
        });
    res
}

fn user_disconnected(my_id: String, users: &Users) {
    info!("good bye user: {}", my_id);

    // Stream closed up, so remove from the user list
    users.lock().unwrap().remove(&my_id);
}

fn user_message(my_id: String, msg: ws::Message, users: &Users)  {
    // Skip any non-Text messages...
    let msg = if let Ok(s) = msg.to_str() {
        s
    } else {
        return;
    };

    // TODO: Serialize the string into a Message struct
    let _mesg: Message<String> = serde_json::from_str(msg).unwrap();

    let new_msg = format!("<User#{}>: {:?}", my_id, msg);

    // New message from this user, send it to everyone else (except same uid)...
    //
    // We use `retain` instead of a for loop so that we can reap any user that
    // appears to have disconnected.
    for (uid, tx) in users.lock().unwrap().iter_mut() {
        // TODO: Get the recipients from mesg.recipients and loop through that
        if my_id != *uid {
            match tx.send(Ok(ws::Message::text(new_msg.clone()))) {
                Ok(()) => (),
                Err(_disconnected) => {
                    // FIXME: Should send some kind of notice
                }
            }
        }
    }
}