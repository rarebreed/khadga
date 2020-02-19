use serde::{Deserialize,
            Serialize};

/// Message that is sent to/from websocket
///
/// {
///   sender: "stoner",
///   recipients: [
/// 	  "whammo"
///   ],
///   body: "How are you doing?",
///   event_type: MessageEvent::Message
/// }
///
/// {
///   sender: "stoner",
///   recipients: [
/// 	  "rubik", "whammo"
///   ],
///   body: {
///     ...
///   },
///   event_type: MessageEvent::Data
/// }
#[derive(Serialize, Deserialize)]
pub struct Message<T> {
    pub sender: String,
    pub recipients: Vec<String>,
    pub body: T,
    pub event_type: MessageEvent,
}

impl<T> Message<T> {
    pub fn new(sender: String, recipients: Vec<String>, evt_type: MessageEvent, body: T) -> Self {
        Message {
            sender,
            recipients,
            body,
            event_type: evt_type,
        }
    }
}

#[derive(Serialize, Deserialize)]
pub enum MessageEvent {
    Connect,
    Disconnect,
    Command,
    Message,
    Data,
}

#[derive(Serialize, Deserialize)]
pub struct ConnectionMsg {
    pub connected_users: Vec<String>,
}

impl ConnectionMsg {
    pub fn new(users: Vec<String>) -> Self {
        ConnectionMsg {
            connected_users: users,
        }
    }
}
