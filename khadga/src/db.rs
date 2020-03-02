//! Contains the mongodb connection, collections, and other helpers
//! FIXME: This code is basically dead for now, since we are no longer using mongodb
//! However, we will eventually need code to store stuff in either Firestore or rethinkdb and I
//! think that a lot of the code skeleton will essentially be the same.  An abstraction over a
//! database would be nice, but rust's `diesel` only works for SQL databases.

use super::{config::Settings,
            data::User};
use bson::{bson,
           doc,
           from_bson,
           to_bson,
           Bson};
use lazy_static::lazy_static;
use log::error;
use mongodb::{results::InsertOneResult,
              Client,
              Collection};
use std::fmt;

lazy_static! {
    pub static ref CONFIG: Settings = { Settings::new().expect("Unable to get config settings") };
}

/// Creates a mongodb client
///
/// Mostly used so we can get a database and collection from the client
pub fn make_client() -> Client {
    let mongo_host = format!("mongodb://{}", CONFIG.services.mongod.host);
    let client = Client::with_uri_str(&mongo_host).expect("Could not create mongodb client");
    client
}

/// Retrieves a collection
///
/// If the collection name exists, it will be retrieved, otherwise a new collection will be created
/// in the database
pub fn get_collection(dbname: &str, coll_name: &str) -> Collection {
    let client = make_client();
    let db = client.database(dbname);
    let coll = db.collection(coll_name);
    coll
}

/// Inserts a User into the `user` collection of the given database
///
/// The actual name of the collection is given from the config file
pub fn make_user(
    client: &Client,
    user: User,
    db: &str,
) -> Result<Collection, Box<dyn std::error::Error>> {
    let db = client.database(db);
    let coll = db.collection(&CONFIG.services.mongod.database);
    let doc = to_bson(&user)?;

    match doc {
        Bson::Document(bdoc) => {
            coll.insert_one(bdoc, None)?;
        }
        _ => error!("Could not serialize user into BSON document"),
    }

    Ok(coll)
}

#[derive(Debug)]
pub struct DeserializeError<'a> {
    error: &'a str,
}

impl<'a> fmt::Display for DeserializeError<'a> {
    fn fmt(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(formatter, "{:?}", self)
    }
}

impl<'a> std::error::Error for DeserializeError<'a> {}

impl<'a> DeserializeError<'a> {
    fn new(msg: &'a str) -> Self {
        DeserializeError { error: msg }
    }
}

pub fn add_user(
    coll: &Collection,
    user: User,
) -> Result<InsertOneResult, Box<dyn std::error::Error>> {
    let doc = to_bson(&user)?;

    match doc {
        Bson::Document(bdoc) => Ok(coll.insert_one(bdoc, None)?),
        _ => Err(Box::new(DeserializeError::new("Not valid format for data"))),
    }
}

pub fn delete_user(
    client: &Client,
    user: &str,
    db: &str,
) -> Result<Collection, mongodb::error::Error> {
    let db = client.database(db);
    let coll = db.collection(&CONFIG.services.mongod.database);

    let filter = doc! { "user_name": user };
    let result = coll.delete_many(filter, None);
    match result {
        Ok(result) => {
            println!("{:?}", result);
            Ok(coll)
        }
        Err(e) => Err(e),
    }
}

pub fn find_user(
    dbname: &str,
    user: &str,
) -> Result<(Collection, Vec<User>), mongodb::error::Error> {
    let coll = get_collection(dbname, &CONFIG.services.mongod.database);
    let cursor = coll.find(doc! {"user_name": user }, None)?;

    let mut users: Vec<User> = vec![];
    for result in cursor {
        match result {
            Ok(document) => {
                println!("{}", document);
                let user_ = from_bson::<User>(Bson::Document(document))?;
                users.push(user_);
            }
            Err(e) => return Err(e),
        }
    }

    Ok((coll, users))
}

pub fn get_user(dbname: &str, user: &str) -> Option<(Collection, Vec<User>)> {
    match find_user(dbname, user) {
        Ok((coll, users)) => Some((coll, users)),
        Err(_) => None,
    }
}

pub fn validate_user_pw(
    dbname: &str,
    user: &User,
) -> Result<(Collection, bool), mongodb::error::Error> {
    let coll = get_collection(dbname, &CONFIG.services.mongod.database);
    let cursor = coll.find(doc! {"user_name": &user.user_name}, None)?;

    let mut matched: bool = false;
    for result in cursor {
        match result {
            Ok(document) => {
                println!("{}", document);
                let user_ = from_bson::<User>(Bson::Document(document))?;
                if user_.psw == user.psw {
                    matched = true;
                    break;
                }
            }
            Err(e) => return Err(e),
        }
    }

    Ok((coll, matched))
}

#[cfg(test)]
mod tests {
    use super::*;
    use bson::{bson,
               Bson};

    const TEST_DB: &str = "test";
    const TEST_USER: &str = "test_user";

    type TestResult = Result<(), Box<dyn std::error::Error>>;

    #[test]
    fn test_find_user() -> TestResult {
        let (_, users) = find_user(TEST_DB, TEST_USER)?;
        assert_eq!(1, users.len());
        println!("{:#?}", users);

        Ok(())
    }

    #[test]
    fn test_connect() {
        let client = make_client();
        let db = client.database("chats");
        let colls = db.list_collection_names(None).expect("No collections");

        for coll in colls {
            println!("Collection name: {:#?}", coll);
        }
    }

    /// FIXME: This function should be moved to an integration test
    #[test]
    fn test_add_user() -> TestResult {
        let user = User::new("stoner".into(), "foo".into(), "blah@gmail.com".into());
        let client = make_client();

        let coll = make_user(&client, user, TEST_DB)?;

        // Find the user
        let filter = doc! { "user_name": "stoner" };
        let found = coll.find_one(filter, None);

        match found {
            Ok(Some(document)) => {
                let fname = document
                    .get("user_name")
                    .and_then(Bson::as_str)
                    .expect("Could not get user_name");
                assert_eq!(fname, "stoner");
                //Ok(())
            }
            Ok(None) => {
                assert!(false);
                //Ok(())
            }
            Err(e) => return Err(Box::new(e)),
        };

        delete_user(&client, "stoner", TEST_DB)?;
        Ok(())
    }
}
