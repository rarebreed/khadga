//! The postgresql database code

use chrono::{NaiveDateTime, Utc};
use diesel::prelude::*;
use diesel::pg::PgConnection;
use dotenv::dotenv;
use std::env;
use crate::pgdb::{models::{Post, NewPost},
                  schema};

/// Creates a connection to our postgres database
pub fn establish_connection() -> PgConnection {
    dotenv().ok();

    let database_url = env::var("DATABASE_URL")
        .expect("DATABASE_URL must be set");
    PgConnection::establish(&database_url)
        .expect(&format!("Error connecting to {}", database_url))
}

// pub fn create_post(
//     conn: &PgConnection,
//     title: String,
//     body: String,
//     author_id: i32
// ) -> Post {
//     use schema::posts;

//     let now = Utc::now().naive_utc();
//     let new_post = NewPost {
//         title: &title,
//         body: &body,
//         created_on: now,
//         author_id,
//     };

//     diesel::insert_into(posts::table)
//         .values(&new_post)
//         .get_result(conn)
//         .expect("Error saving new post")
// }

#[cfg(tests)]
mod tests {
    use super::*;
    use diesel_demo::schema::posts::dsl::*;

    fn test_show_posts() {
        let connection = establish_connection();
        let results = posts.filter(published.eq(true))
            .limit(5)
            .load::<Post>(&connection)
            .expect("Error loading posts");
    
        println!("Displaying {} posts", results.len());
        for post in results {
            println!("{}", post.title);
            println!("----------\n");
            println!("{}", post.body);
        }
    }
}