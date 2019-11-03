//! Contains data and schema that will be stored in mongodb

use serde::{ Serialize, Deserialize };
use std::fmt::{ Display, Formatter, self };

#[derive(Serialize, Deserialize, Debug)]
pub struct User {
    name: String,
    key: String,
    creation: String,
    role: Roles
}

impl User {
    pub fn new(name: String, key: String) -> Self {
      let user_name = name.clone();
      User {
          name,
          key,
          creation: String::from(""),
          role: Roles::User(user_name)
      }
    }
}

#[derive(Serialize, Deserialize, Debug)]
pub(crate) enum Roles {
    User(String),
    Admin
}

impl Display for Roles {
    fn fmt(&self, fmt: &mut Formatter) -> fmt::Result {
        match self {
            Roles::User(name) => {
                write!(fmt, "User<{}>", name)
            },
            Roles::Admin => {
                write!(fmt, "{}", "Admin")
            }
        }
    }
}