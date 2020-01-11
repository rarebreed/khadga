//! Contains the mongodb connection, collections, and other helpers

use super::{config::Settings,
            data::User};
use bson::{doc,
           to_bson};
use lazy_static::*;
use log::error;
use mongodb::{Client,
              Collection};

lazy_static! {
    pub static ref CONFIG: Settings = { Settings::new().expect("Unable to get config settings") };
}

pub fn make_client() -> Client {
    let mongo_host = format!("mongodb://{}", CONFIG.services.mongod.host);
    let client = Client::with_uri_str(&mongo_host).expect("Could not create mongodb client");
    client
}

pub fn make_user(client: &Client,
                 user: User,
                 db: &str)
                 -> Result<Collection, Box<dyn std::error::Error>> {
    let db = client.database(db);
    let coll = db.collection(&CONFIG.services.mongod.database);
    let doc = to_bson(&user)?;

    match doc {
        bson::Bson::Document(bdoc) => {
            coll.insert_one(bdoc, None)?;
        }
        _ => error!("Could not serialize user into BSON document"),
    }

    Ok(coll)
}

#[cfg(test)]
mod tests {
    use super::*;
    use bson::{bson,
               Bson};

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

    /// FIXME: This function should be moved to an integration test
    #[test]
    fn test_add_user() -> TestResult {
        let user = User::new("stoner".into(),
                             "Sean".into(),
                             "Toner".into(),
                             "foo".into(),
                             "blah@gmail.com".into());
        let client = make_client();

        let coll = make_user(&client, user, "test")?;

        // Find the user
        let filter = doc! { "user_name": "stoner" };
        let found = coll.find_one(filter, None);

        match found {
            Ok(Some(document)) => {
                let fname = document.get("first_name")
                                    .and_then(Bson::as_str)
                                    .expect("Could not get first_name");
                assert_eq!(fname, "Sean");
                Ok(())
            }
            Ok(None) => {
                assert!(false);
                Ok(())
            }
            Err(e) => Err(Box::new(e)),
        }
    }
}
