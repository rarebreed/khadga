//! Contains the mongodb connection, collections, and other helpers
//! 

use mongodb::{ 
    Client, ThreadedClient,
    db::{ ThreadedDatabase }
};
use super::{ data::User };
use bson::to_bson;
use log::{ error };

pub fn make_client() -> Client {
    let client = Client::with_uri("mongodb://127.0.0.1").expect("Could not create  mongodb client");
    client
}

pub fn make_user( client: &Client
                , user: User
                , db: &str) 
                -> Result<(), Box<dyn std::error::Error>> {
    let coll = client.db(db).collection("Users");
    let doc = to_bson(&user)?;

    match doc {
      bson::Bson::Document(bdoc) => {
        coll.insert_one(bdoc, None)?;
      },
      _ => {
         error!("Could not serialize user into BSON document")
      }
    }

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    type TestResult = Result<(), Box<dyn std::error::Error>>;

    #[test]
    fn connect() {
        let client = make_client();
        let db = client.db("chats");
        let colls = db.list_collections(None).expect("No collections");
        println!("{:#?}", colls);
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