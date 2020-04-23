use chrono::{DateTime, Utc};

pub struct User {
    pub user_id: i32,
    pub first_name: String,
    pub last_name: String,
    pub username: String,
    pub email: String,
}

pub struct Post {
    pub post_id: i32,
    pub author_id: i32,
    pub title: String,
    pub body: String,
    pub published: bool,
    pub created_on: DateTime<Utc>,
}

pub struct NewPost<'a> {
    pub author_id: i32,
    pub title: &'a str,
    pub body: &'a str,
    pub created_on: DateTime<Utc>
}