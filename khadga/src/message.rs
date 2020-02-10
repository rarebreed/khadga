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
pub struct Message {
	sender: String,
	recipients: Vec<String>,
	body: String
}