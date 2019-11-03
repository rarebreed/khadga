//! Contains the mongodb connection, collections, and other helpers
//! 

use mongodb::{ Client, ThreadedClient };

pub fn make_client() -> Client {
    let client = Client::connect("localhost", 27107).expect("Could not create  mongodb client");
    client
}