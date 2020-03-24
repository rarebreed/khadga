use serde::{Deserialize,
            Serialize};
use chrono::{Utc};
use std::{fmt::{self, Display, Formatter},
          convert::{From}};

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
#[derive(Serialize, Deserialize, Debug)]
pub struct Message<T> {
    pub sender: String,
    pub recipients: Vec<String>,
    pub body: T,
    pub event_type: MessageEvent,
    pub time: i64
}

impl<T> Message<T> {
    pub fn new(sender: String, recipients: Vec<String>, evt_type: MessageEvent, body: T) -> Self {
        Message {
            sender,
            recipients,
            body,
            event_type: evt_type,
            time: Utc::now().timestamp_millis()
        }
    }

    pub fn from<R>(&self, body: R) -> Message<R> {
        Message::new(
            self.sender.clone(),
            self.recipients.clone(),
            self.event_type.clone(),
            body,
        )
    }
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub enum MessageEvent {
    Connect,
    Disconnect,
    CommandRequest,
    CommandReply,
    Message,
    Data,
}

impl Display for MessageEvent {
    fn fmt(&self, fmt: &mut Formatter) -> fmt::Result {
        match self {
            MessageEvent::Connect => write!(fmt, "{}", "Connect"),
            MessageEvent::Disconnect => write!(fmt, "{}", "Disconnect"),
            MessageEvent::CommandRequest => write!(fmt, "{}", "CommandRequest"),
            MessageEvent::CommandReply => write!(fmt, "{}", "CommandReply"),
            MessageEvent::Message => write!(fmt, "{}", "Message"),
            MessageEvent::Data => write!(fmt, "{}", "Data")
        }
    }
}

impl From<MessageEvent> for String {
    fn from(name: MessageEvent) -> String {
        match name {
            MessageEvent::Connect => "Connect".into(),
            MessageEvent::Disconnect => "Disconnect".into(),
            MessageEvent::CommandRequest => "CommandRequest".into(),
            MessageEvent::CommandReply => "CommandReply".into(),
            MessageEvent::Message => "Message".into(),
            MessageEvent::Data => "Data".into()
        }
    }
}

impl From<&str> for MessageEvent {
    fn from(name: &str) -> MessageEvent {
        match name {
            "Connect" => MessageEvent::Connect,
            "Disconnect" => MessageEvent::Disconnect,
            "CommandRequest" => MessageEvent::CommandRequest,
            "CommandReply" => MessageEvent::CommandReply,
            "Message" => MessageEvent::Message,
            "Data" => MessageEvent::Data,
            _ => panic!("")
        }
    }
}

impl From<String> for MessageEvent {
    fn from(name: String) -> MessageEvent {
        match name.as_str() {
            "Connect" => MessageEvent::Connect,
            "Disconnect" => MessageEvent::Disconnect,
            "CommandRequest" => MessageEvent::CommandRequest,
            "CommandReply" => MessageEvent::CommandReply,
            "Message" => MessageEvent::Message,
            "Data" => MessageEvent::Data,
            _ => panic!("")
        }
    }
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

#[derive(Serialize, Deserialize, Debug)]
pub enum CommandTypes {
    Ping,
    Pong,
    SDPOffer,
    SDPAnswer,
    IceCandidate,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct Command {
    pub op: CommandTypes,
    pub ack: bool,
    pub id: String,
}

impl Command {
    pub fn new(op: CommandTypes, ack: bool, id: String) -> Self {
        Command { op, ack, id }
    }
}

impl Default for Command {
    fn default() -> Self {
        Command {
            op: CommandTypes::Ping,
            ack: true,
            id: "".into(),
        }
    }
}

#[derive(Serialize, Deserialize, Debug)]
pub struct CommandRequestMsg<T> {
    pub cmd: Command,
    pub args: T,
}

impl<T> CommandRequestMsg<T> {
    pub fn new(op: CommandTypes, ack: bool, id: String, args: T) -> Self {
        CommandRequestMsg {
            cmd: Command::new(op, ack, id),
            args,
        }
    }
}

impl Default for CommandRequestMsg<Vec<String>> {
    fn default() -> Self {
        CommandRequestMsg {
            cmd: Command::default(),
            args: vec![],
        }
    }
}

#[derive(Serialize, Deserialize)]
pub struct CommandReplyMsg<T> {
    pub cmd: Command,
    pub response: T,
}

impl<T> CommandReplyMsg<T> {
    pub fn new(op: CommandTypes, ack: bool, id: String, response: T) -> Self {
        CommandReplyMsg {
            cmd: Command::new(op, ack, id),
            response,
        }
    }
}


#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_sdp_message() {
        let msg: Message<String> = Message::new(
            "placeoftheway".into(),
            vec!["manjusri".into()],
            MessageEvent::CommandRequest,
            r#"{ 
                "sender": "placeoftheway",
                "recipients": ["manjusri"],
                "event_type: "CommandRequest",
                "time": 150000000,
                "body": {
                    "cmd": {
                        "op": "offer",
                        "ack": false,
                        "id": "noone"
                    }
                },
                args: ["something"]
            }"#.into()
        );
        
        let from_str_msg: String = serde_json::to_string(&msg).expect("Could not deserilaize");
        println!("CommandRequest Message as str: {}", from_str_msg);

        let strmsg = r#"{ 
            "sender": "placeoftheway",
            "time": 150000000,
            "event_type": "CommandRequest",
            "body": {
                "cmd": {
                    "op": "SDPOffer",
                    "ack": false,
                    "id": "noone"
                },
                "args": "Seomthing"
            },
            "recipients": ["manjusri"]
        }"#;

        let msg: Message<CommandRequestMsg<String>> = serde_json::from_str(strmsg).expect("Could not parse");
        println!("CommandRequest Message: {:#?}", msg);

        let cmsg: Message<String> = serde_json::from_str(&from_str_msg).expect("Failed to parse");
        println!("Back from conversion: {:#?}", cmsg);
        
        let ping_msg = r#"{"sender":"khadga","recipients":[],"event_type":"CommandReply","time":1584316937601,"body":"{\"cmd\":{\"op\":\"pong\",\"ack\":false,\"id\":\"placeoftheway\"},\"args\":[]}"}"#;
        
        let msg: Message<String> = serde_json::from_str(ping_msg).expect("Could not serialize");
        println!("Ping Message: {:#?}", msg);
    }
}