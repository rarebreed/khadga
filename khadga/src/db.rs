//! Contains the mongodb connection, collections, and other helpers

use super::{config::Settings,
            data::User};
use bson::{bson,
           doc,
           to_bson};
use lazy_static::lazy_static;
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

pub fn get_collection(dbname: &str, coll_name: &str) -> Collection {
    let client = make_client();
    let db = client.database(dbname);
    let coll = db.collection(coll_name);
    coll
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

pub fn delete_user(client: &Client,
                   user: &str,
                   db: &str)
                   -> Result<Collection, mongodb::error::Error> {
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

pub fn find_user(dbname: &str, user: &str) -> Result<Collection, mongodb::error::Error> {
    let coll = get_collection(dbname, &CONFIG.services.mongod.database);
    let cursor = coll.find(doc! {
        "user_name": user
    }, None)?;

    for result in cursor {
        match result {
            Ok(document) => println!("{}", document),
            Err(e) => return Err(e)
        }
    }

    Ok(coll)
}


#[cfg(test)]
mod tests {
    use super::*;
    use bson::{bson,
               Bson};

    const TEST_DB: &str = "test";

    type TestResult = Result<(), Box<dyn std::error::Error>>;

    #[test]
    fn test_find_user() {
        let result = find_user(TEST_DB, "stoner");
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
        let user = User::new("stoner".into(),
                             "Sean".into(),
                             "Toner".into(),
                             "foo".into(),
                             "blah@gmail.com".into());
        let client = make_client();

        let coll = make_user(&client, user, TEST_DB)?;

        // Find the user
        let filter = doc! { "user_name": "stoner" };
        let found = coll.find_one(filter, None);

        match found {
            Ok(Some(document)) => {
                let fname = document.get("first_name")
                                    .and_then(Bson::as_str)
                                    .expect("Could not get first_name");
                assert_eq!(fname, "Sean");
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
