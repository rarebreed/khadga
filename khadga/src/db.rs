//! Contains the mongodb connection, collections, and other helpers
//! 

use mongodb::{ 
    Client, ThreadedClient,
    db::{ ThreadedDatabase }
};

pub fn make_client() -> Client {
    let client = Client::connect("127.0.0.1", 27107).expect("Could not create  mongodb client");
    client
}

mod tests {
    use super::*;

    #[test]
    fn connect() {
        let client = make_client();
        let db = client.db("chats");
        let colls = db.list_collections(None).expect("No collections");
        println!("{:?}", colls);
    }
}