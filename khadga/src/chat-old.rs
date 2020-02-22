use crate::{message::{ConnectionMsg,
											Message,
											MessageEvent}};
use futures::{future,
							Future,
							FutureExt,
							StreamExt};
use log::{error,
          info};
use std::{collections::HashMap,
					sync::{Arc,
								Mutex}};
use tokio::sync::mpsc;
use warp::{filters::BoxedFilter,
					 ws,
					 Filter,
					 Reply};

type Users = Arc<Mutex<HashMap<String, mpsc::UnboundedSender<Result<ws::Message, warp::Error>>>>>;

/// FIXME: This automatically accepts all users.
///
/// Route for /chat/:username
///
/// Should use JWT tokens to make sure user has been authorized
pub async fn chat(users: Users) -> BoxedFilter<(impl Reply,)> {
	let users2 = warp::any().map(move || users.clone());

	let chat = warp::path("chat")
			.and(ws())
			.and(warp::path::param().map(|username: String| username))
			.and(users2)
			.map(|ws: ws::Ws, username: String, users: Users| {
					println!("User {} starting chat", username);
					ws.on_upgrade(move |socket| {
							connect_user(socket, users, username)
					})
			});
	chat.boxed()
}

async fn connect_user(
	ws: ws::WebSocket,
	users: Users,
	username: String,
) {
	// Split the socket into a sender and receive of messages.
	let (user_tx, mut user_rx) = ws.split();

	// Use an unbounded channel to handle buffering and flushing of messages
	// to the websocket
	// FIXME:  I dont think we should use an unbounded channel or we can run into memory pressure
	// issues.  Might need to do some profiling, but since rust's async uses a polling method
	// we automatically get backpressure support.
	let (tx, rx) = mpsc::unbounded_channel();

	// Create an async task that handles the messages streaming from rx by forwarding them
	// to user_tx.  This will drive the Stream backed by rx to send values to user_tx until
	// rx is exhausted.  This is how we send messages from khadga to the client
	tokio::task::spawn(rx.forward(user_tx).map(|result| {
			if let Err(e) = result {
					error!("websocket send error: {}", e);
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

			let mut _user_str = user_list.iter().fold("".into(), |mut acc: String, next| {
					acc = acc + &next + "\n";
					acc
			});
	}

	// Send back a list of connected users.  Remember that tx is connected to rx.  Earlier
	// we forwarded rx channel to user_tx.  So anything we send via tx2 will also be received
	// by rx, and therefore will be sent over to user_tx and then over the websocket
	let conn_list = ConnectionMsg::new(user_list);
	let connect_msg = Message::new(username.clone(), vec![], MessageEvent::Connect, conn_list);

	// Send a connection event to each connected user
	// FIXME:  I think we can put this in the loop above.  No need to clone again
	let event_users = users.clone();
	let list = event_users.lock().unwrap();
	for (user, tx) in list.iter() {
			info!("Sending connect event to {}", user);
			let connect_msg_str: String =
					serde_json::to_string(&connect_msg).expect("Unable to serialize to Message");
			tx.send(Ok(ws::Message::text(connect_msg_str)))
					.expect("Failed to send to tx");
	}

	// Every time the user sends a message, broadcast it to
	// all other users...
	let copied_user = username.clone();
  while let Some(result) = user_rx.next().await {
			let msg = match result {
					Ok(msg) => {
						let user_copy = copied_user.clone();
	
						user_message_handler(user_copy, msg, &users).await;
				  },
					Err(e) => {
							let user_copy = copied_user.clone();
							eprintln!("websocket error(uid={}): {}", user_copy, e);
							break;
					}
			};
	}

	let user_copy = username.clone();
	user_disconnected(user_copy, &users2).await;
}

fn get_users(users: &Users) -> Vec<String> {
	let mut user_list: Vec<String> = vec![];
	let users2 = users.clone();
	{
			let list = users2.lock().unwrap();
			info!("Connected Users:");

			for (key, _) in list.iter() {
					info!("{}", key);
					user_list.push(key.clone());
			}

			let mut _user_str = user_list.iter().fold("".into(), |mut acc: String, next| {
					acc = acc + &next + "\n";
					acc
			});
	}
	user_list
}

async fn user_disconnected(username: String, users: &Users) {
	info!("good bye user: {}", username);

	// Stream closed up, so remove from the user list
	let mut list = users.lock().unwrap();
	list.remove(&username);

	// Send message to all other users that user has disconnected
	// Send back a list of connected users.  Remember that tx is connected to rx.  Earlier
	// we forwarded rx channel to user_tx.  So anything we send via tx2 will also be received
	// by rx, and therefore will be sent over to user_tx and then over the websocket
	let user_list = get_users(&users);
	let conn_list = ConnectionMsg::new(user_list);
	let connect_msg = Message::new(
			username.clone(),
			vec![],
			MessageEvent::Disconnect,
			conn_list,
	);

	for (user, tx) in list.iter() {
			info!("Sending connection event to {}", user);
			let connect_msg_str: String =
					serde_json::to_string(&connect_msg).expect("Unable to serialize to Message");
			tx.send(Ok(ws::Message::text(connect_msg_str)))
					.expect("Failed to send to tx");
	}
}

async fn user_message_handler(my_id: String, msg: ws::Message, users: &Users) {
	// Skip any non-Text messages...
	let msg = if let Ok(s) = msg.to_str() {
			s
	} else {
			return;
	};

	let _mesg: Message<String> = serde_json::from_str(msg).unwrap();

	let new_msg = format!("<User#{}>: {:?}", my_id, msg);
	info!("Got message {}", new_msg);

	// New message from this user, send it to everyone in the recipient list
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
