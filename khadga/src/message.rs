use serde::{Serialize, Deserialize};

/// Message that is sent from websocket
/// 
/// {
///   sender: "stoner",
///   recipients: [
/// 	  "whammo"
///   ],
///   body: "How are you doing?"
/// }
#[derive(Serialize, Deserialize)]
pub struct Message<T> {
	sender: String,
	recipients: Vec<String>,
	body: T
}

impl<T> Message<T> {
	pub fn new(sender: String, recipients: Vec<String>, body: T) -> Self {
		Message {
			sender,
			recipients,
			body
		}
	}
}