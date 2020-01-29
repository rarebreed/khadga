use khadga::{auth::{login,
                    register},
             config::Settings};
use std::net::SocketAddr;
use warp::Filter;

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

    //let conn_users = Arc::new(Mutex::new(HashMap::<String, String>::new()));

    // This is the main entry point to the application
    // Note the relative path.  The path is relative to where you are executing/launching khadga
    // from.  In this case, if we run `cargo run`, this path will work.  However, if we run like
    // `./target/debug/khadga`  it will not.  But, if we cd to target, then run `./debug/khadga`
    // it will work.  This is confusing, and something to keep in mind.
    let start = warp::fs::dir("../vision/dist");

    let log = warp::log("khadga");
    let app = login().or(register()).or(start).with(log);

    let host: SocketAddr = khadga_addr
        .parse()
        .expect(&format!("Could not parse {}", khadga_addr));
    println!("Starting up on {}", host);
    warp::serve(app).run(host).await;
    println!("Ended service");
}
