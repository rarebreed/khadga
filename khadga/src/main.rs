use khadga::{auth::{login,
                    register,
                    chat},
             config::Settings};
use std::{net::SocketAddr,
          sync::{Arc, Mutex},
          collections::HashMap};
use warp::{Filter,
           ws};
use tokio::sync::{mpsc};

/// This is a map of users to a tokio mpsc channel
/// 
/// It is wrapped in an Arc so that we can share it across different runtime executors which might 
/// happen since we are using tokio.  The Mutex makes that only one Executor thread can access the
/// HashMap storing the data at a time.
/// 
/// The mpsc  
type Users = Arc<Mutex<HashMap<String, 
                               mpsc::UnboundedSender<Result<ws::Message, warp::Error>>>>>;

#[tokio::main]
async fn main() {
    let config = match Settings::new() {
        Ok(cfg) => cfg,
        Err(_) => panic!("Could not read config file"),
    };
    let log_level = format!("khadga={}", config.logging.level.repr());
    let khadga_addr = format!(
        "{}:{}",
        config.services.khadga.host, config.services.khadga.port
    );

    std::env::set_var("RUST_LOG", &log_level);
    env_logger::init();

    let connected_users: Users = Arc::new(Mutex::new(HashMap::new()));


    // This is the main entry point to the application
    // Note the relative path.  The path is relative to where you are executing/launching khadga
    // from.  In this case, if we run `cargo run`, this path will work.  However, if we run like
    // `./target/debug/khadga`  it will not.  But, if we cd to target, then run `./debug/khadga`
    // it will work.  This is confusing, and something to keep in mind.
    let start = warp::fs::dir("../vision/dist");

    let log = warp::log("khadga");
    let app = login()
      .or(register())
      .or(chat(connected_users.clone()))
      .or(start)
      .with(log);

    let host: SocketAddr = khadga_addr
        .parse()
        .expect(&format!("Could not parse {}", khadga_addr));
    println!("Starting up on {}", host);
    warp::serve(app).run(host).await;
    println!("Ended service");
}
