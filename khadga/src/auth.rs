//! # AuthN and authZ for site
//!
//! We are not getting fancy here...yet.  We are using Google's single sign on OAuth for
//! authentication but we still need a way to protect some endpoints.
//!
//! ## Signing in
//!
//! When the user clicks the Sign in with Google button, the google api.js library will reach out
//! and provide a confirmation window.  When the user accepts, the user's profile information will
//! be returned, including user_id and email along with the real User name.
//!
//! ### User types
//!
//! Currently, there will only be one user type.  In the future, there may other user types.  For
//! example, there may be a free tier and a premium tier.  To make a distinction between these
//! types, we will need something additional to mark the user as being of a different kind.
//! Eventually we can use Firestore or rethinkdb to hold this extra information.
//!
//! ## AuthZ tokens
//!
//! Once authenticated, a JWT will be created.  This token will expire in 15 minutes.  All requests
//! from the agent (the user is using) will pass this JWT token around.  The token will only be
//! stored in memory and not in a cookie to reduce the chance that a token can be hijacked from the
//! user's system.

use crate::{data::User,
            db::{add_user,
                 get_user,
                 validate_user_pw}};
use jsonwebtoken::{decode,
                   encode,
                   errors::ErrorKind,
                   Algorithm,
                   DecodingKey,
                   EncodingKey,
                   Header,
                   Validation};
use log::error;
use serde::{Deserialize,
            Serialize};
use warp::{filters::BoxedFilter,
           http::{Response,
                  StatusCode},
           Filter,
           Reply};

#[derive(Debug, Serialize, Deserialize)]
struct Claims {
    sub: String,
    user: String,
    exp: usize,
}

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

/// FIXME: This method is now deprecated, but might return once we have a freemium/premium model
///
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
                        .status(StatusCode::from_u16(409).unwrap())
                        .body("User already exists")
                }
                Some((coll, users)) if users.is_empty() => {
                    // FIXME: This code will change for Firestore or rethinkdb
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

/// FIXME: This should be in a different module
///
/// This is the handler for when the user clicks the Login button on the app.
pub fn login() -> BoxedFilter<(impl Reply,)> {
    let login = warp::post()
        .and(warp::path("login"))
        .and(warp::body::json())
        .map(|login_params: LoginParams| {
            println!("{:#?}", login_params);
            // TODO: Need a login handler and a websocket endpoint
            // When a user logs in, they will be given an auth token which can be used
            // to hain access to chat and video for as long as the session maintains activity
            let builder = Response::builder();
            let user = User::new(login_params.uname, login_params.psw, "".into());
            match validate_user_pw("khadga", &user) {
                Ok((_, true)) => {
                    // TODO: Provide a JWT token we can use for other endpoints like `chat`
                    builder.status(StatusCode::OK).body("User authenticated")
                }
                _ => {
                    builder
                        .status(StatusCode::from_u16(403).unwrap())
                        .body("Unable to retrieve data from database")
                }
            }
        });
    login.boxed()
}

pub fn create_jwt(user: &str) {}
