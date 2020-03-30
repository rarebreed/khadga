use super::schema::{posts, users};

use diesel::sql_types::{Date};
use chrono::{NaiveDateTime};

#[derive(Queryable)]
pub struct User {
    pub user_id: i32,
    pub first_name: String,
    pub last_name: String,
    pub email: String,
}

#[derive(Insertable)]
#[table_name="users"]
pub struct NewUser<'a> {
    pub first_name: &'a str,
    pub last_name: &'a str,
    pub email: &'a str
}

#[derive(Queryable)]
pub struct Post {
    pub post_id: i32,
    pub author_id: i32,
    pub title: String,
    pub body: String,
    pub published: bool,
    pub created_on: Date,
}

#[derive(Insertable)]
#[table_name="posts"]
pub struct NewPost<'a> {
    pub author_id: i32,
    pub title: &'a str,
    pub body: &'a str,
    pub created_on: NaiveDateTime
}