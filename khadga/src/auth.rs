//! # AuthN and authZ for site
//!
//! We are not getting fancy here...yet.  Ideally we should use something like keycloak + 2fa
//! For now, we are going to be less user friendly, and use simple password for authentication.
//!
//! ## Registration
//!
//! When the user first registers, they will supply their email and a username/password pair.
//! The username must be unique, so we will check the database if this username exists.  If not,
//! then we will map the username, password and email to a document in the database.  An email will
//! be generated and sent to the user's email address confirming registration.
//!
//! ### User types
//!
//! Currently, there will only be one user type.  In the future, there may other user types.  For
//! example, there may be a free tier and a premium tier.
//!
//! ## Logging in
//!
//! When a user has registered successfully, they can then log in with their username and password.
//! When the form is submitted, we simply look up the username in the database.  We allow only 3
//! failed attempts.  The user must then wait 1 hour, or change password via email.
//!
//! This means we must keep track of login attempts.  In the future, we may also track the IP
//! address and/or user agent as a means to further secure.
//!
//! Once authenticated, a JWT will be created.  This token will expire in 15 minutes.  All requests
//! from the agent (the user is using) will pass this JWT token around.

use crate::{data::User,
            db::{add_user,
                 get_user}};
use log::error;
use serde::{Deserialize,
            Serialize};
use warp::{filters::BoxedFilter,
           http::{Response,
                  StatusCode},
           Filter,
           Reply};

#[derive(Serialize, Deserialize, Debug)]
pub struct LoginParams {
    uname: String,
    psw: String,
}

#[derive(Deserialize, Serialize, Debug)]
pub struct RegisterParams {
    uname: String,
    psw: String,
    email: String,
}

pub fn register() -> BoxedFilter<(impl Reply,)> {
    let route = warp::post()
        .and(warp::path("register"))
        .and(warp::body::json())
        .map(|reg_params: RegisterParams| {
            println!("{:#?}", reg_params);

            let builder = Response::builder();
            let reply = match get_user("khadga", &reg_params.uname) {
                Some((_, users)) if users.len() >= 1 => {
                    error!("More than one user with name of {}", reg_params.uname);
                    builder
                        .status(StatusCode::from_u16(403).unwrap())
                        .body("User already exists")
                }
                Some((coll, users)) if users.is_empty() => {
                    // Add user to db
                    let user = User::new(reg_params.uname, reg_params.psw, reg_params.email);

                    match add_user(&coll, user) {
                        Err(_) => builder.status(StatusCode::from_u16(500).unwrap()).body(""),
                        _ => builder.status(StatusCode::OK).body("Added user"),
                    }
                }
                _ => {
                    builder
                        .status(StatusCode::from_u16(500).unwrap())
                        .body("Unable to retrieve data from database")
                }
            };

            reply
        });
    route.boxed()
}

pub fn login() -> BoxedFilter<(impl Reply,)> {
    let login = warp::post()
        .and(warp::path("login"))
        .and(warp::body::json())
        .map(|login_params: LoginParams| {
            println!("{:#?}", login_params);
            // TODO: Need a login handler and a websocket endpoint
            // When a user logs in, they will be given an auth token which can be used to hain access to
            // chat and video for as long as the session maintains activity
            warp::reply()
        });
    login.boxed()
}
