//! Contains data and schema that will be stored in mongodb
//!
//! User type contains the name of the user, a public key, the email, a creation date, and role
//! Instead of using passwords for authentication, users will upload a public key from an RSA pair
//! This is more secure than using a password, but not as invasive a MFA.

use serde::{Deserialize,
            Serialize};
use std::fmt::{self,
               Display,
               Formatter};

#[derive(Serialize, Deserialize, Debug)]
pub struct User {
    name: String,
    key: String,
    email: String,
    creation: String,
    role: Role,
}

impl User {
    pub fn new(name: String, key: String, email: String) -> Self {
        let user_name = name.clone();
        User { name,
               key,
               email,
               creation: String::from(""),
               role: Role::User(user_name) }
    }
}

#[derive(Serialize, Deserialize, Debug)]
pub(crate) enum Role {
    User(String),
    Admin,
}

impl Display for Role {
    fn fmt(&self, fmt: &mut Formatter) -> fmt::Result {
        match self {
            Role::User(name) => write!(fmt, "User<{}>", name),
            Role::Admin => write!(fmt, "{}", "Admin"),
        }
    }
}
