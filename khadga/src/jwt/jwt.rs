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

mod jwt_numeric_date {
    use chrono::{DateTime, TimeZone, Utc};
    use serde::{self, Deserialize, Deserializer, Serializer};
    
    /// Serializes a DateTime<Utc> to a Unix timestamp (milliseconds since 1970/1/1T00:00:00T)
    pub fn serialize<S>(date: &DateTime<Utc>, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        let timestamp = date.timestamp();
        serializer.serialize_i64(timestamp)
    }

    /// Attempts to deserialize an i64 and use as a Unix timestamp
    pub fn deserialize<'de, D>(deserializer: D) -> Result<DateTime<Utc>, D::Error>
    where
        D: Deserializer<'de>,
    {
        Utc.timestamp_opt(i64::deserialize(deserializer)?, 0)
            .single() // If there are multiple or no valid DateTimes from timestamp, return None
            .ok_or_else(|| serde::de::Error::custom("invalid Unix timestamp value"))
    }
}


pub static SECRET: &[u8;9] = b"secretkey";


pub fn create_jwt(user: &str, email: &str) -> Result<String, JWTError> {
    // FIXME: We need some way to create this secret key and store it both in source, and for
    // deployment
    let my_claims = Claims {
        sub: user.to_owned(),
        email: email.to_owned(),
        exp: Utc::now() + chrono::Duration::minutes(15),
        iat: Utc::now(),
    };

    let token = match encode(
        &Header::default(),
        &my_claims,
        &EncodingKey::from_secret(SECRET),
    ) {
        Ok(t) => Ok(t),
        Err(err) => {
            error!("Got error creating token: {}", err);
            Err(err)
        }
    };
    token
}

pub fn validate_jwt(user: &str, token: &str) {
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
                    // still logged in and last message sent.  If so, automatically create a new 
                    // token for the user and send it back.
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
