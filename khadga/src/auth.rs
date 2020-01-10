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

use actix_web::{post,
                web,
                HttpResponse};
use serde::{Deserialize,
            Serialize};

#[derive(Serialize, Deserialize)]
pub struct LoginParams {
    uname: String,
    psw: String,
}

#[post("/login")]
pub async fn login(params: web::Form<LoginParams>) -> actix_web::Result<HttpResponse> {
    Ok(HttpResponse::Ok().content_type("text/plain")
                         .body(format!("Your name is {}", params.uname)))
}
