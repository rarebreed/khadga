use khadga::{auth::login,
             chat::{user_connected,
                    Users},
             config::Settings};
use log::info;
use std::{collections::HashMap,
          net::SocketAddr,
          sync::Arc};
use tokio::sync::Mutex;
use warp::{http::{Response,
                  StatusCode},
           ws::Ws,
           Filter};

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
    let health = warp::get().and(warp::path("health")).map(|| {
        // TODO: Make this more robust and informational
        let builder = Response::builder();
        builder.status(StatusCode::OK).body("")
    });

    let users: Users = Arc::new(Mutex::new(HashMap::new()));
    let users2 = warp::any().map(move || users.clone());

    // This is the main chat endpoint.  When the front end needs to perform chat, it will call
    // this endpoint.
    let chat = warp::path("chat")
        /* .and(warp::cookie("jwt")) */
        .and(warp::ws())
        .and(warp::path::param().map(|username: String| username))
        .and(users2)
        .map(|/* cookie: String, */ ws: Ws, username: String, users: Users| {
            /* info!("Cookie is: {}", cookie); */
            info!("User {} starting chat", username);
            ws.on_upgrade(move |socket| user_connected(socket, users, username))
        });

    // This is the main entry point to the application
    // Note the relative path.  The path is relative to where you are executing/launching khadga
    // from.  In this case, if we run `cargo run`, this path will work.  However, if we run like
    // `./target/debug/khadga`  it will not.  But, if we cd to target, then run `./debug/khadga`
    // it will work.  This is confusing, and something to keep in mind.
    let start = warp::fs::dir("../vision/dist");

    let log = warp::log("khadga");

    let app = chat
        .or(health)
        .or(start)
        .or(login())
        .with(log);

    let host: SocketAddr = khadga_addr
        .parse()
        .expect(&format!("Could not parse {}", khadga_addr));
    info!("Starting up on {}", host);
    let warp_server = warp::serve(app);

    // Check to see if we need to use TLS
    if config.tls.set {
        let ca_path = config.tls.ca_path;
        let key_path = config.tls.key_path;
        info!("Using TLS.  ca_path={}, key_path={}", ca_path, key_path);

        warp_server
            .tls()
            .cert_path(ca_path)
            .key_path(key_path)
            .run(host)
            .await;
    } else {
        warp_server.run(host).await;
    }

    info!("Ended service");
}
