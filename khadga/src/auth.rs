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
            jwt::jwt::{create_jwt}};
use serde::{Deserialize,
            Serialize};
use std::convert::Infallible;
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

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct LoginParams {
    uname: String,
    email: String,
    token: String,
}

#[derive(Deserialize, Serialize, Debug)]
pub struct RegisterParams {
    uname: String,
    psw: String,
    email: String,
}

#[derive(Debug, Serialize, Deserialize)]
struct AuthPost {
    token: String
}

/// FIXME: This method is now deprecated, but might return once we have a freemium/premium model
/*
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
*/

/// Will perform a verification request from the mimir service
/// 
/// Note: If you try to make this return Result<impl Reply, warp::http::Error> you will get an error
/// from the type that some traits are not accepted.  By making this infallible, and only ever
/// returning a Reply (which itself holds the error) we can make this work
pub async fn make_verify_request(
    args: (LoginParams, User)
) -> Result<impl Reply, Infallible> {
    let (params, user) = args;

    // Get the mimir host and port from the kube env vars
    let mimir_host = std::env::var("MIMIR_NODE_IP_SERVICE_SERVICE_HOST")
        .expect("Please startup mimir-node-ip-service");
    let mimir_port = std::env::var("MIMIR_NODE_IP_SERVICE_SERVICE_PORT")
        .expect("Please startup mimir-node-ip-service");
    let mimir = format!("http://{}:{}/auth", mimir_host, mimir_port);

    let builder = Response::builder();
    let post_data = AuthPost { token: params.token };
    let response = reqwest::Client::new()
        .post(&mimir)
        .json(&post_data)
        .send()
        .await;
    
    let resp = match response {
        Ok(resp) => {
            if resp.status() != 201 {
                builder
                    .status(resp.status())
                    .body(format!("Unable to generate JWT token"))
            } else {                      // Generate JWT
                match create_jwt(&user.user_name, &user.email) {
                    Ok(jwt) => {
                        builder
                            .status(StatusCode::OK)
                            .body(jwt)
                    },
                    Err(e) => {
                        builder
                            .status(StatusCode::from_u16(403).unwrap())
                            .body(format!("Unable to generate JWT token: {}", e))
                    }
                }
            }
        },
        Err(err) => {
            builder
                .status(StatusCode::from_u16(500).unwrap())
                .body(format!("Failed getting response: {}", err))
        }
    };
    
    Ok(resp.expect("Could not build response"))
}

/// This is the handler for when the user clicks the Sign in with Google button on the app.
/// 
/// Once the user authorizes us with Google, the client will hit this endpoint and provide some
/// information.  We will store some user information in the database and then return back a JWT
/// that the client will save in memory.  Eventually we will provide a means for the user to submit
/// a public key which we will store.  We can then use a custom header for the JWT token and sign it
/// with the public key.  We can then allow the client to store the JWT in a cookie
pub fn login() -> BoxedFilter<(impl Reply,)> {
    let login = warp::post()
        .and(warp::path("login"))
        .and(warp::body::json())
        .map(|login_params: LoginParams| {
            // TODO: Need a login handler and a websocket endpoint
            // When a user logs in, they will be given an auth token which can be used
            // to hain access to chat and video for as long as the session maintains activity
            let params_copy = login_params.clone();
            let user = User::new(
                login_params.uname,
                login_params.email,
                login_params.token
            );
            (params_copy, user)
        })
        .and_then(make_verify_request);
    login.boxed()
}

