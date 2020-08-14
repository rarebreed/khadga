//! The postgresql database code

use dotenv::dotenv;
use std::env;
use tokio_postgres::{
    Connection, NoTls, Error, Socket, Client,
    tls::{NoTlsStream}
};
use tokio::{fs::{File},
            io::{AsyncReadExt}};
use chrono::{Utc, DateTime};
use log::{error, info};
use crate::pgdb::{models};

pub type DbConnection = Connection<Socket, NoTlsStream>;
pub type ConnectReturn = (Client, DbConnection);


/// Creates a connection to our postgres database
pub async fn establish_connection(dbname: &str) -> Result<ConnectReturn, Error> {
    dotenv().ok();

    // If we're running under docker stack, we need to look for the secrets file
    // If we're running under kubernetes, we need to look at kubernetes secrets
    match env::var("KHADGA_STACK") {
        Ok(val) => if val.to_lowercase() == "true" { 
            // Read the /run/secrets/postgres-secret file
            match File::open("/run/secrets/postgres-secret").await {
                Ok(mut f) => {
                    let mut contents = vec![];
                    let res = f.read_to_end(&mut contents).await;
                    res.map( |read_in| {
                        info!("{} bytes were read in", read_in);
                    }).expect("Unable to read in file")
                },
                Err(e) => {
                    error!("Error while getting khadga database: {}", e)
                }
            }
            
        },
        Err(_) => { }
    };

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
    table: &str,
    client: &Client,
) -> Result<(), Error> {
    let res = client.batch_execute(&format!("
    DROP TABLE IF EXISTS {};
    ", table)).await?;

    Ok(res)
}

pub async fn make_table_posts(
    table: &str,
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
    )", table, refers_to)).await?;

    Ok(res)
}

pub async fn make_table_users(
    table: &str,
    client: &Client
) -> Result<(), Error> {
    let res = client.batch_execute(&format!("
    CREATE TABLE {} (
        user_id SERIAL PRIMARY KEY,
        first_name VARCHAR NOT NULL,
        last_name VARCHAR NOT NULL,
        username VARCHAR NOT NULL,
        email VARCHAR NOT NULL
    )", table)).await?;

    Ok(res)
}

pub async fn make_table_comments(
    table: &str,
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
    )", table, refers_to)).await?;

    Ok(res)
}

pub async fn make_table_accounts(
    table: &str,
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
    )", table, refers_to)).await?;

    Ok(res)
}

pub async fn make_table_uploads(
    table: &str,
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
    )", table, refers_to)).await?;

    Ok(res)
}

pub fn make_now() -> DateTime<Utc> {
    let now = Utc::now().naive_utc();
    DateTime::from_utc(now, Utc)
}

pub async fn insert_user(
    client: &Client,
    table: &str,
    user: &models::User
) -> Result<u64, Error>{
    println!("Inserting user");

    let cmd = format!("
    INSERT INTO {} (first_name, last_name, username, email) 
    VALUES ($1, $2, $3, $4);
    ", table);
    let rows = client.execute(
        cmd.as_str(), 
        &[&user.first_name, &user.last_name, &user.username, &user.email]
    ).await?;

    Ok(rows)
}

pub async fn lookup_user(
    client: &Client,
    table: &str,
    user: &models::User
) -> Result<Vec<i32>, Error> {
    println!("Lookup up user {}", user.username);

    let cmd = format!("
    SELECT user_id FROM {table}
    WHERE {table}.username='{name}';
    ", table=table, name=user.username);
    println!("Using command:\n{}", cmd);

    let mut userids: Vec<i32> = vec![];
    let rows = client.query(cmd.as_str(), &[]).await?;
    for row in rows {
        userids.push(row.get(0));
    }
    Ok(userids)
}

/**
 * Inserts a post into the given table 
 */
pub async fn insert_post(
    client: &Client,
    table: &str,
    title: &str,
    body: &str,
    author_id: i32
) -> Result<u64, Error> {
    let now = make_now();
    println!("Inserting post with time {}", now);

    let cmd = format!("
    INSERT INTO {} (title, body, created_on, author_id)
    VALUES ($1, $2, $3, $4);
    ", table);
    println!("cmd is {}", cmd);
    let rows = client.execute("
    INSERT INTO test_posts (title, body, created_on, author_id)
    VALUES ($1, $2, $3, $4);
    ", &[&title, &body, &now, &author_id]).await?;

    Ok(rows)
}

#[cfg(test)]
mod tests {
    use super::*;

    /**
     * Inserts a post into the database
     * 
     * This should actually be an integration test, as it does and tests the following: 
     * 
     * - Drops the test_posts and test_users database (in that order)
     * - Creates the test_users and test_posts database (in that order)
     * - Inserts a user into test_users
     * - Inserts a post into test_posts 
     */
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
        let user = models::User {
            user_id: -1,
            first_name: String::from("Sean"),
            last_name: String::from("Toner"),
            username: String::from("stoner"),
            email: String::from("foo@bar.com")
        };
        let rows = insert_user(&client, db_users, &user).await?;
        println!("Inserted test user: {}", rows);

        // Look up user
        let userids = lookup_user(&client, db_users, &user).await?;
        for id in userids.into_iter() {
            println!("user id = {}", id);
        }

        // Create a post
        let _res = insert_post(&client,
            db_posts,
            "Just a test",
            r#"
            <html>
                <head>
                </head>
                <body>
                    Just a simple html page
                </body>
            </html>"#, 1).await?;
        println!("Inserted post");

        // Now, make a query for this
        let rows = client.query("
            SELECT first_name, last_name, user_id
            FROM test_posts
            RIGHT JOIN test_users
            ON test_posts.author_id=test_users.user_id",
            &[]
        ).await?;
        
        assert!(rows.len() == 1, "Async test");

        for row in rows {
            let first: &str = row.get("first_name");
            let last: &str = row.get("last_name");
            let id: i32 = row.get("user_id");
            println!("name is {} {} with id {}", first, last, id);
        }

        Ok(())
    }
}