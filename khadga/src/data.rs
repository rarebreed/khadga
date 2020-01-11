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
    user_name: String,
    first_name: String,
    last_name: String,
    psw: String,
    email: String,
    created: String,
    role: Role,
}

impl User {
    pub fn new(uname: String, fname: String, lname: String, psw: String, email: String) -> Self {
        let user_name = uname.clone();
        User { user_name: uname,
               first_name: fname,
               last_name: lname,
               psw,
               email,
               created: String::from(""),
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
