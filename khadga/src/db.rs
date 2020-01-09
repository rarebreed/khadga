//! Contains the mongodb connection, collections, and other helpers
//!

use super::data::User;
use bson::to_bson;
use log::error;
use mongodb::Client;

pub fn make_client() -> Client {
    let client = Client::with_uri_str("mongodb://127.0.0.1").expect("Could not create  mongodb client");
    client
}

pub fn make_user(client: &Client, user: User, db: &str) -> Result<(), Box<dyn std::error::Error>> {
    let db = client.database(db);
    let coll = db.collection("Users");
    let doc = to_bson(&user)?;

    match doc {
        bson::Bson::Document(bdoc) => {
            coll.insert_one(bdoc, None)?;
        }
        _ => error!("Could not serialize user into BSON document"),
    }

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    type TestResult = Result<(), Box<dyn std::error::Error>>;

    #[test]
    fn test_connect() {
        let client = make_client();
        let db = client.database("chats");
        let colls = db.list_collection_names(None).expect("No collections");

        for coll in colls {
            println!("Collection name: {:#?}", coll);
        }
    }

    #[test]
    #[ignore]
    fn test_add_user() -> TestResult {
        let user = User::new(String::from("Sean Toner"), "foo".into(), "blah".into());
        let client = make_client();

        make_user(&client, user, "chats")?;
        Ok(())
    }
}
