use std::{collections::HashMap,
	        sync::Arc,
					time::Instant};
use tokio::sync::{mpsc, Mutex};
use warp::ws::{Message};

pub struct UserInfo {
	pub sender: mpsc::UnboundedSender<Result<Message, warp::Error>>,
	pub data_usage: (Instant, usize)
}

pub type Users = Arc<Mutex<HashMap<String, mpsc::UnboundedSender<Result<Message, warp::Error>>>>>;