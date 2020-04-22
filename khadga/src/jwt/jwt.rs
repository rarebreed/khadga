use chrono::prelude::*;
use jsonwebtoken::{decode,
                   encode,
                   errors::{Error as JWTError,
                            ErrorKind},
                   DecodingKey,
                   EncodingKey,
                   Header,
                   Validation};
use log::{error,
          info};
use serde::{Deserialize,
            Serialize};

#[derive(Debug, Serialize, Deserialize, PartialEq)]
struct Claims {
    sub: String,
    email: String,
    #[serde(with = "jwt_numeric_date")]
    exp: DateTime<Utc>,
    #[serde(with = "jwt_numeric_date")]
    iat: DateTime<Utc>,
}

#[derive(Deserialize, Serialize)]
pub struct JWTResponse {
    pub token: String,
    pub expiry: i64
}

/// By default, jsonwebtoken expects the exp field to be a usize.  It is however more convenient to
/// work with DateTime and Duration than raw usize (in millis since Epoch).  This is how we
mod jwt_numeric_date {
    use chrono::{DateTime, TimeZone, Utc};
    use serde::{self, Deserialize, Deserializer, Serializer};
    
    /// Serializes a DateTime<Utc> to a Unix timestamp (milliseconds since 1970/1/1T00:00:00T)
    pub fn serialize<S>(date: &DateTime<Utc>, serializer: S) -> Result<S::Ok, S::Error>
        where S: Serializer,
    {
        let timestamp = date.timestamp();
        serializer.serialize_i64(timestamp)
    }

    /// Attempts to deserialize an i64 and use as a Unix timestamp
    pub fn deserialize<'de, D>(deserializer: D) -> Result<DateTime<Utc>, D::Error>
        where D: Deserializer<'de>,
    {
        Utc.timestamp_opt(i64::deserialize(deserializer)?, 0)
            .single() // If there are multiple or no valid DateTimes from timestamp, return None
            .ok_or_else(|| serde::de::Error::custom("invalid Unix timestamp value"))
    }
}

/// FIXME: This will eventually be some kind of secret key that will be stored in a Docker secret or
/// perhaps pull it from the database
pub static SECRET: &[u8;9] = b"secretkey";

/// Generates a JSON web token using defaults
pub fn create_jwt(user: &str, email: &str) -> Result<String, JWTError> {
    let expiry = Utc::now() + chrono::Duration::minutes(15);
    let exp = expiry.timestamp_millis();
    let my_claims = Claims {
        sub: user.to_owned(),
        email: email.to_owned(),
        exp: expiry,
        iat: Utc::now(),
    };

    // TODO: Store information about the logged in user to the database

    let token = match encode(
        &Header::default(),
        &my_claims,
        &EncodingKey::from_secret(SECRET),
    ) {
        Ok(t) => {
            let resp = JWTResponse {
                token: t,
                expiry: exp
            };
            Ok(serde_json::to_string_pretty(&resp).expect("unable to decode"))
        },
        Err(err) => {
            error!("Got error creating token: {}", err);
            Err(err)
        }
    };
    token
}

/// Validator for a given user and supplied token
/// 
/// FIXME: This is always panicking.  We need a way to handle this gracefully and return a Result
pub fn validate_jwt(user: &str, token: &str) {
    let jwt: JWTResponse = serde_json::from_str(token).expect("unable to encode");
    let token = jwt.token;

    let validation = Validation {
        sub: Some(user.to_string()),
        ..Validation::default()
    };

    let token_data = match decode::<Claims>(&token, &DecodingKey::from_secret(SECRET), &validation) {
        Ok(c) => c,
        Err(err) => {
            match *err.kind() {
                ErrorKind::InvalidToken => {
                    panic!("Token is invalid")
                }
                ErrorKind::InvalidIssuer => {
                    panic!("Issuer is invalid")
                },
                ErrorKind::ExpiredSignature => {
                    // For example, expired token.  In this case, we should check to see if user is
                    // still logged in and last message sent.
                    // TODO: If the above is true, automatically create a new token for the user
                    // and send the jwt back to the user
                    panic!("Expired token")
                },
                _ => {
                    eprintln!("{}", err);
                    panic!("Some other errors")
                }
            }
        }
    };

    println!("{:?}", token_data.claims);
    info!("{:?}", token_data.header);
}

#[cfg(test)]
mod tests {
    use super::*;

    type TestResult = Result<(), Box<dyn std::error::Error>>;

    #[test]
    fn test_create_jwt() -> TestResult {
        let jwt = create_jwt("stoner", "foobar@gmail.com")?;

        println!("JWT is {}", jwt);

        Ok(())
    }

    #[test]
    fn test_validate_token() -> TestResult {
        let jwt = create_jwt("stoner", "foobar@gmail.com")?;

        validate_jwt("stoner", &jwt);

        Ok(())
    }

    // FIXME: Need to figure out how to make negative test
    // #[test]
    fn _test_expired_jwt() {
        let jwt = Claims {
            sub: "stoner".to_owned(),
            email: "foobar".to_owned(),
            exp: Utc::now() - chrono::Duration::minutes(15),
            iat: Utc::now(),
        };

        let token = match encode(
            &Header::default(),
            &jwt,
            &EncodingKey::from_secret(SECRET),
        ) {
            Ok(t) => t,
            Err(err) => {
                error!("Got error creating token: {}", err);
                panic!("Couldn't create token")
            }
        };

        validate_jwt("stoner", &token);
    }
}
