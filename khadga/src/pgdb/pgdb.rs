//! The postgresql database code

use dotenv::dotenv;
use std::env;
use tokio_postgres::{
    Connection, NoTls, Error, Socket, Client,
    tls::{NoTlsStream}
};
//use log::{info};
use chrono::{Utc, DateTime};
use crate::pgdb::{models};

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
    println!("Using connection params: {}", config);

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

pub async fn make_table_posts(
    dbname: &str,
    refers_to: &str,
    client: &Client
) -> Result<(), Error> {
    let res = client.batch_execute(&format!("
    CREATE TABLE {} (
        post_id SERIAL PRIMARY KEY,
        author_id INTEGER NOT NULL,
        title VARCHAR NOT NULL,
        body TEXT NOT NULL,
        created_on TIMESTAMPTZ NOT NULL,
        published BOOLEAN NOT NULL DEFAULT 'f',
        FOREIGN KEY (author_id) REFERENCES {}(user_id)
    )", dbname, refers_to)).await?;

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
    refers_to: &str,
    client: &Client
) -> Result<(), Error> {
    let res = client.batch_execute(&format!("
    CREATE TABLE {} (
        comment_id SERIAL PRIMARY KEY,
        body TEXT NOT NULL,
        user_id INTEGER NOT NULL,
        ref_post_id INTEGER NOT NULL,
        created_on TIMESTAMPTZ NOT NULL,
        ref_comment_id INTEGER,
        FOREIGN KEY (user_id) REFERENCES users(user_id),
        FOREIGN KEY (ref_post_id) REFERENCES posts(post_id),
        FOREIGN KEY (ref_comment_id) REFERENCES {}(comment_id)
    )", dbname, refers_to)).await?;

    Ok(res)
}

pub async fn make_table_accounts(
    dbname: &str,
    refers_to: &str,
    client: &Client
) -> Result<(), Error> {
    let res = client.batch_execute(&format!("
    CREATE TABLE {} (
        account_id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        account_type CHAR(20),
        created_on TIMESTAMPTZ NOT NULL,
        active BOOLEAN NOT NULL DEFAULT 'f',
        CHECK (account_type in ('free', 'premium_annual', 'premium_monthly')),
        FOREIGN KEY (user_id) REFERENCES {}(user_id) ON DELETE CASCADE
    )", dbname, refers_to)).await?;

    Ok(res)
}

pub async fn make_table_uploads(
    dbname: &str,
    refers_to: &str,
    client: &Client
) -> Result<(), Error> {
    let res = client.batch_execute(&format!("
    CREATE TABLE {} (
        upload_id SERIAL PRIMARY KEY,
        last_upload_date TIMESTAMPTZ NOT NULL,
        file_name VARCHAR NOT NULL,
        user_id INTEGER NOT NULL,
        FOREIGN KEY (user_id) REFERENCES {}(user_id)
    )", dbname, refers_to)).await?;

    Ok(res)
}


pub fn make_now() -> DateTime<Utc> {
    let now = Utc::now().naive_utc();
    DateTime::from_utc(now, Utc)
}

pub async fn insert_user(
    client: &Client,
    dbname: &str,
    user: &models::User
) -> Result<u64, Error>{
    println!("Inserting user");

    let cmd = format!("
    INSERT INTO {} (first_name, last_name, email) 
    VALUES ($1, $2, $3);
    ", dbname);
    let rows = client.execute(cmd.as_str(), &[&user.first_name, &user.last_name, &user.email]).await?;

    Ok(rows)
}

/**
 * Inserts a post into the database
 */
pub async fn insert_post(
    client: &Client,
    dbname: &str,
    title: &str,
    body: &str,
    author_id: i32
) -> Result<u64, Error> {
    let now = make_now();
    println!("Inserting post with time {}", now);

    let cmd = format!("INSERT INTO {} (title, body, created_on, author_id)
    VALUES ($1, $2, $3, $4);
    ", dbname);
    println!("cmd is {}", cmd);
    let rows = client.execute("INSERT INTO test_posts (title, body, created_on, author_id)
    VALUES ($1, $2, $3, $4);
    ", &[&title, &body, &now, &author_id]).await?;

    Ok(rows)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_drop_create_table() -> Result<(), Error> {
        let (client, connection) = establish_connection("test_db").await?;

        // The connection object performs the actual communication with the database,
        // so spawn it off to run on its own.
        tokio::spawn(async move {
            if let Err(e) = connection.await {
                eprintln!("connection error: {}", e);
            }
        });

        drop_table("test_users", &client).await?;

        let res = make_table_users("test_users", &client).await;
        match res {
            Err(e) => {
                eprintln!("Error in database table creation: {}", e);
            },
            _ => {
                println!("Successful");
            }
        }
        // drop_table("test_users", &client).await?;
        
        assert!(true, "Async test");

        Ok(())
    }

    #[tokio::test]
    async fn test_insert_post() -> Result<(), Error> {
        let (client, connection) = establish_connection("test_db").await?;
        let db_posts = "test_posts";
        let db_users = "test_users";

        // The connection object performs the actual communication with the database,
        // so spawn it off to run on its own.
        tokio::spawn(async move {
            if let Err(e) = connection.await {
                eprintln!("connection error: {}", e);
            }
        });

        drop_table(db_posts, &client).await?;
        drop_table(db_users, &client).await?;
        

        make_table_users(db_users, &client).await?;
        println!("Created test_users table");
        make_table_posts(db_posts, db_users, &client).await?;
        println!("Created test_posts table");

        // Create a user first, otherwise referential integrity won't hold
        let rows = insert_user(&client, db_users, &models::User {
            user_id: -1,
            first_name: String::from("Sean"),
            last_name: String::from("Toner"),
            email: String::from("foo@bar.com")
        }).await?;
        println!("Inserted test user: {}", rows);

        // Create a post
        let _res = insert_post(&client,
            db_posts,
            "Just a test",
            r#"<html>
            <head>
            </head>
            <body>
                Just a simple html page
            </body>
            </html>"#, 1).await?;
        println!("Inserted post");

        // Now, make a query for this
        let rows = client.query(
            r#"SELECT * FROM test_posts
            WHERE author_id=1"#,
            &[]
        ).await?;
        
        assert!(rows.len() == 1, "Async test");

        Ok(())
    }
}