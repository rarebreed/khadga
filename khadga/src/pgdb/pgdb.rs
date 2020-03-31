//! The postgresql database code

use dotenv::dotenv;
use std::env;
use tokio_postgres::{
    Connection, NoTls, Error, Socket, Client,
    tls::{NoTlsStream}
};
use chrono::{Utc, DateTime};
// use crate::pgdb::{models::{Post, NewPost}};

pub type DbConnection = Connection<Socket, NoTlsStream>;
pub type ConnectReturn = (Client, DbConnection);

/// Creates a connection to our postgres database
pub async fn establish_connection(dbname: &str) -> Result<ConnectReturn, Error> {
    dotenv().ok();

    let config = format!(
        "host=localhost user={} password={} dbname={}",
        env::var("DB_USER").expect("Could not get DB_USER variable"),
        env::var("DB_PASSWORD").expect("Could not get DB_PASSWORD variable"),
        dbname
    );

    let (client, connection) = tokio_postgres::connect(
        &config, NoTls
    ).await?;

    Ok((client, connection))
}

pub async fn drop_table(
    dbname: &str,
    client: &Client,
) -> Result<(), Error> {
    let res = client.batch_execute(&format!("
    DROP TABLE IF EXISTS {};
    ", dbname)).await?;

    Ok(res)
}

pub async fn make_table_post(
    dbname: &str,
    client: &Client
) -> Result<(), Error> {
    let res = client.batch_execute(&format!("
    CREATE TABLE {} (
        post_id SERIAL PRIMARY KEY,
        author_id INTEGER NOT NULL,
        title VARCHAR NOT NULL,
        body TEXT NOT NULL,
        created_on TIMESTAMP NOT NULL,
        published BOOLEAN NOT NULL DEFAULT 'f',
        FOREIGN KEY (author_id) REFERENCES users(user_id)
    )", dbname)).await?;

    Ok(res)
}

pub async fn make_table_users(
    dbname: &str,
    client: &Client
) -> Result<(), Error> {
    let res = client.batch_execute(&format!("
    CREATE TABLE {} (
        user_id SERIAL PRIMARY KEY,
        first_name VARCHAR NOT NULL,
        last_name VARCHAR NOT NULL,
        email VARCHAR NOT NULL
    )", dbname)).await?;

    Ok(res)
}

pub async fn make_table_comments(
    dbname: &str,
    client: &Client
) -> Result<(), Error> {
    let res = client.batch_execute(&format!("
    CREATE TABLE {} (
        comment_id SERIAL PRIMARY KEY,
        body TEXT NOT NULL,
        user_id INTEGER NOT NULL,
        ref_post_id INTEGER NOT NULL,
        created_on TIMESTAMP NOT NULL,
        ref_comment_id INTEGER,
        FOREIGN KEY (user_id) REFERENCES users(user_id),
        FOREIGN KEY (ref_post_id) REFERENCES posts(post_id),
        FOREIGN KEY (ref_comment_id) REFERENCES comments(comment_id)
    )", dbname)).await?;

    Ok(res)
}

pub async fn make_table_accounts(
    dbname: &str,
    client: &Client
) -> Result<(), Error> {
    let res = client.batch_execute(&format!("
    CREATE TABLE {} (
        account_id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        account_type CHAR(20),
        created_on TIMESTAMP NOT NULL,
        active BOOLEAN NOT NULL DEFAULT 'f',
        CHECK (account_type in ('free', 'premium_annual', 'premium_monthly')),
        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
    )", dbname)).await?;

    Ok(res)
}

pub async fn make_table_uploads(
    dbname: &str,
    client: &Client
) -> Result<(), Error> {
    let res = client.batch_execute(&format!("
    CREATE TABLE {} (
        upload_id SERIAL PRIMARY KEY,
        last_upload_date TIMESTAMP NOT NULL,
        file_name VARCHAR NOT NULL,
        user_id INTEGER NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(user_id)
    )", dbname)).await?;

    Ok(res)
}


pub fn make_now() -> DateTime<Utc> {
    let now = Utc::now().naive_utc();
    DateTime::from_utc(now, Utc)
}

/**
 * Inserts a post into the database
 */
pub async fn insert_post(
    client: &Client,
    title: String,
    body: String,
    author_id: i32
) -> Result<u64, Error> {
    let now = make_now();

    let rows = client.execute(r#"INSERT INTO posts (title, body, created_on, author_id)
    VALUES ($1, $2, $2, $4)
    "#, &[&title, &body, &now, &author_id]).await?;

    Ok(rows)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_drop_table() -> Result<(), Error> {
        let (client, _) = establish_connection("test_db").await?;

        drop_table("test_users", &client).await?;
        
        assert!(true, "Async test");

        Ok(())
    }
}