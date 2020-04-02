use tokio_postgres;
use tokio::process::{Command};

use khadga::pgdb;

/// Creates a connection to our postgres database
pub async fn establish_connection_test() -> Result<ConnectReturn, Error> {
  dotenv().ok();

  let config = format!(
      "host=localhost user={} password={} dbname={}",
      env::var("DB_USER_TEST").expect("Could not get DB_USER_TEST variable"),
      env::var("DB_PASSWORD_TEST").expect("Could not get DB_PASSWORD_TEST variable"),
      env::var("DB_NAME_TEST").expect("Could not get DB_NAME_TEST env var")
  );

  let (client, connection) = tokio_postgres::connect(
      &config, NoTls
  ).await?;

  Ok((client, connection))
}

/// Starts up docker swarm for testing
/// 
/// TODO: We need to make commander crate use async
pub fn startup_docker_swarm() {
  let cmd = Command::new();
}

pub async fn fixtures() -> Result<ConnectReturn, Error> {
  let (client, conn) = establish_connection_test().await?;

  Ok((client, conn))
}