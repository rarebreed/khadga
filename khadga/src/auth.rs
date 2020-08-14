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
            jwt::jwt::{create_jwt, JWTResponse},
            pgdb::{pgdb,
                   models}};
use tokio_postgres::{Client};
use chrono::{Utc, Duration};
use serde::{Deserialize,
            Serialize};
use std::convert::Infallible;
use warp::{filters::BoxedFilter,
           http::{Response,
                  StatusCode},
           Filter,
           Reply};
use log::{info, error};
use lazy_static::lazy_static;
use crate::config::Settings;

lazy_static! {
    pub static ref CONFIG: Settings =  Settings::new().expect("Unable to get config settings");
}

#[derive(Debug, Serialize, Deserialize)]
struct Claims {
    sub: String,
    user: String,
    exp: usize,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct LoginParams {
    uname: String,
    first: String,
    last: String,
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

pub fn build_cookie(
    key: &str,
    val: &str,
    expires: Option<Duration>,
    flags: &[&str]
) -> String {
    let mut cookie = format!("{}={};", key, val);
    if let Some(dur) = expires {
        let expires_at = Utc::now() + dur;
        cookie = cookie + &format!(" expires={}", expires_at.to_rfc2822())
    }

    let final_cookie = flags.into_iter()
        .fold(cookie.clone(), |mut acc, next| {
            acc = acc + "; " + &next;
            return acc
        });
    final_cookie
}

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
    let mimir_host = match std::env::var("MIMIR_NODE_IP_SERVICE_SERVICE_HOST") {
        Ok(val) => val,                  // If it exists, we're running under kubernetes
        Err(_) => String::from("mimir")  // assume we're running from docker stack
    };
        
    let mimir_port = match std::env::var("MIMIR_NODE_IP_SERVICE_SERVICE_PORT") {
        Ok(val) => val,
        Err(_) => "80".into()
    };
    
    let mimir = format!("http://{}:{}/auth", mimir_host, mimir_port);
    info!("Making request to {}", mimir);

    let builder = Response::builder();
    let post_data = AuthPost { token: params.token };
    let response = reqwest::Client::new()
        .post(&mimir)
        .json(&post_data)
        .send()
        .await;

    // Lookup user in database.  If he doesn't exist, generate a user.
    let db_client: Client;
    match pgdb::establish_connection("test_db").await {
        Ok((client, _)) => {
            db_client = client;
        },
        Err(e) => {
            let resp = builder.status(StatusCode::from_u16(500).unwrap())
                .body(format!("Unable to create connection to postgresql database: {}", e))
                .expect("Unable to create HTTP Response");
            return Ok(resp)
        }
    };
    
    let resp = match response {
        Ok(resp) => {
            if resp.status() != 201 {
                builder
                    .status(resp.status())
                    .body(format!("Unable to generate JWT token"))
            } else {                      // Generate JWT
                let dbuser = models::User {
                    email: user.email.clone(),
                    first_name: String::from(""),
                    last_name: String::from(""),
                    username: user.user_name.clone(),
                    user_id: -1
                };
                match pgdb::lookup_user(&db_client, "users", &dbuser).await {
                    Ok(user_id) => {
                        if user_id.len() != 1 {
                            error!("There is an error with query or multiple usernames found");
                            panic!("Integrity with database is compromised");
                        }
                        let userid = user_id[0];
                        info!("User ID is {}", userid);
                        // TODO, perform any other logic here
                    },
                    Err(_) => {  // In this case, we haven't seen this user before, so let's add him
                        match pgdb::insert_user(&db_client, "users", &dbuser).await {
                            Ok(count) => {
                                if count != 1 {
                                    return Ok(builder.status(StatusCode::from_u16(500).unwrap())
                                        .body("Unable to insert user into database".into())
                                        .expect("Unable to create HTTP Response"));
                                }
                            },
                            Err(e) => {
                                return Ok(builder.status(StatusCode::from_u16(500).unwrap())
                                    .body(format!("Unable to insert user into database: {}", e))
                                    .expect("Unable to create HTTP Response"))
                            }
                        }
                    }
                };

                match create_jwt(&user.user_name, &user.email) {
                    Ok(jwt) => {
                        let jwt_resp: JWTResponse = serde_json::from_str(&jwt)
                            .expect("Could not deserialize");

                        let duration = Duration::minutes(15);
                        let exp = Utc::now() + duration;
                        let secure_flags = vec!["secure", "samesite=strict"];
                        // This kind of sucks, but this is how you can concat slice/vecs
                        let http_only_flags = [&["httpOnly"], &secure_flags[..]].concat();

                        let cookie = build_cookie(
                            "jwt",
                            &jwt_resp.token,
                            Some(duration),
                            &http_only_flags
                        );
                        info!("jwt cookie: {}", cookie);

                        let expires = build_cookie("expiry", &exp.to_rfc2822(), None, &vec![]);
                        info!("expiry cookie: {}", expires);

                        let username_s: Vec<&str> = user.email.split("@").collect();
                        let username = username_s.get(0).expect("Could not determine username");
                        let khadga_user = build_cookie(
                            "khadga_user",
                            &username,
                            Some(duration),
                            &secure_flags
                        );
                        info!("khadga_user cookie: {}", khadga_user);

                        let resp = builder
                            .status(StatusCode::OK)
                            .header("Set-Cookie", cookie)
                            .header("Set-Cookie", expires)
                            .header("Set-Cookie", khadga_user);
                        info!("{:?}", resp);

                        resp.body(jwt)
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
            // to gain access to chat and video for as long as the session maintains activity
            let params_copy = login_params.clone();
            let user = User::new(
                login_params.uname,
                login_params.first,
                login_params.last,
                login_params.email,
                login_params.token
            );
            (params_copy, user)
        })
        .and_then(make_verify_request);
    login.boxed()
}

