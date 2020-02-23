use khadga::{auth::{login,
                    register},
             chat::user_connected,
             config::Settings};
use std::{collections::HashMap,
          net::SocketAddr,
          sync::Arc};
use tokio::sync::{mpsc,
                  Mutex};
use warp::{ws,
           ws::Ws,
           Filter};

/// This is a map of users to a tokio mpsc channel
///
/// It is wrapped in an Arc so that we can share it across different runtime executors which might
/// happen since we are using tokio.  The Mutex makes that only one Executor thread can access the
/// HashMap storing the data at a time.
///
/// The mpsc  
type Users = Arc<Mutex<HashMap<String, mpsc::UnboundedSender<Result<ws::Message, warp::Error>>>>>;

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

    // simple health check
    let hello = warp::path!("health" / String).map(|name| format!("Alive!, {}!", name));

    let users: Users = Arc::new(Mutex::new(HashMap::new()));
    let users2 = warp::any().map(move || users.clone());

    // This is the main chat endpoint.  When the front end needs to perform chat, it will call
    // this endpoint.
    let chat = warp::path("chat")
        .and(warp::ws())
        .and(warp::path::param().map(|username: String| username))
        .and(users2)
        .map(|ws: Ws, username: String, users: Users| {
            println!("User {} starting chat", username);
            ws.on_upgrade(move |socket| user_connected(socket, users, username))
        });

    // This is the main entry point to the application
    // Note the relative path.  The path is relative to where you are executing/launching khadga
    // from.  In this case, if we run `cargo run`, this path will work.  However, if we run like
    // `./target/debug/khadga`  it will not.  But, if we cd to target, then run `./debug/khadga`
    // it will work.  This is confusing, and something to keep in mind.
    let start = warp::fs::dir("../vision/dist");

    let log = warp::log("khadga");
    
    let app = login()
        .or(register())
        .or(chat)
        .or(start)
        .or(hello)
        .with(log);

    let host: SocketAddr = khadga_addr
        .parse()
        .expect(&format!("Could not parse {}", khadga_addr));
    println!("Starting up on {}", host);
    warp::serve(app).run(host).await;
    println!("Ended service");
}
