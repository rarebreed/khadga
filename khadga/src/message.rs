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

    pub fn from<R>(&self, body: R) -> Message<R> {
        Message::new(self.sender.clone(), self.recipients.clone(), self.event_type.clone(), body)
    }
}

#[derive(Serialize, Deserialize, Clone)]
pub enum MessageEvent {
    Connect,
    Disconnect,
    CommandRequest,
    CommandReply,
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

#[derive(Serialize, Deserialize)]
pub enum CommandTypes {
    Ping,
    Pong
}

#[derive(Serialize, Deserialize)]
pub struct Command {
    pub op: CommandTypes,
    pub ack: bool,
    pub id: String,
}

impl Command {
    pub fn new(op: CommandTypes, ack: bool, id: String) -> Self {
        Command {
            op,
            ack,
            id
        }
    }
}

impl Default for Command {
    fn default() -> Self {
        Command {
            op: CommandTypes::Ping,
            ack: true,
            id: "".into()
        }
    }
}

#[derive(Serialize, Deserialize)]
pub struct CommandRequestMsg<T> {
    pub cmd: Command,
    pub args: T
}

impl<T> CommandRequestMsg<T> {
    pub fn new(op: CommandTypes, ack: bool, id: String, args: T) -> Self {
        CommandRequestMsg {
            cmd: Command::new(op, ack, id),
            args
        }
    }
}

impl Default for CommandRequestMsg<Vec<String>> {
    fn default() -> Self {
        CommandRequestMsg {
            cmd: Command::default(),
            args: vec![]
        }
    }
}

#[derive(Serialize, Deserialize)]
pub struct CommandReplyMsg<T> {
    pub cmd: Command,
    pub response: T
}

impl<T> CommandReplyMsg<T> {
    pub fn new(op: CommandTypes, ack: bool, id: String, response: T) -> Self {
        CommandReplyMsg {
            cmd: Command::new(op, ack, id),
            response
        }
    }
}