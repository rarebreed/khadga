use chrono::{DateTime,
             Utc};
use std::{collections::HashMap,
          fmt::{self,
                Display,
                Formatter},
          sync::Arc,
          ops::{Add}};
use tokio::sync::{mpsc,
                  Mutex};
use warp::ws::Message;

pub type Sender = mpsc::UnboundedSender<Result<Message, warp::Error>>;

pub struct MessageInventory {
    pub data_sent: usize,
    pub message_time: DateTime<Utc>
}

impl MessageInventory {
    pub fn new(data_sent: usize, message_time: Option<DateTime<Utc>>) -> Self {
        let time = if let Some(t) = message_time {
            t
        } else {
            Utc::now()
        };

        MessageInventory {
            data_sent,
            message_time: time
        }
    }
}

pub struct UserInfo {
    pub sender: Option<Sender>,
    data_usage: usize,
    last_message: DateTime<Utc>,
    pub login_time: DateTime<Utc>,
}

impl UserInfo {
    pub fn new(sender: Option<Sender>) -> Self {
        UserInfo {
            sender,
            data_usage: 0,
            last_message: Utc::now(),
            login_time: Utc::now(),
        }
    }

    pub fn clear_data_usage(&mut self) {
        self.data_usage = 0;
    }
}

impl Display for UserInfo {
    fn fmt(&self, fmt: &mut Formatter) -> fmt::Result {
        write!(
            fmt,
            r#"{{
    data_usage: {},
    last_message: {},
    login_time: {},
}}"#,
            self.data_usage, self.last_message, self.login_time
        )
    }
}

/// Allows us to add a MessageInventory object to a UserInfo
/// let mut user = UserInfo::new();
/// user = user + MessageInventory::new()
impl Add<MessageInventory> for UserInfo {
    type Output = Self;

    fn add(self, other: MessageInventory) -> Self {
        UserInfo {
            data_usage: self.data_usage + other.data_sent,
            last_message: other.message_time,
            ..self
        }
    }
}

pub type Users = Arc<Mutex<HashMap<String, UserInfo>>>;

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_user_info() {
        let mut user = UserInfo::new(None);

        println!("{}", user);

        let sent_msg = MessageInventory::new(1024, None);
        user = user + sent_msg;

        println!("{}", user);
    }
}
