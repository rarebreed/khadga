use khadga::{auth::LoginParams,
             config::Settings};
use std::net::SocketAddr;
use warp::Filter;

#[tokio::main]
async fn main() {
    let config = match Settings::new() {
        Ok(cfg) => cfg,
        Err(_) => panic!("Could not read config file"),
    };
    let log_level = format!("actix_web={}", config.logging.level.repr());
    let khadga_addr = format!("{}:{}",
                              config.services.khadga.host, config.services.khadga.port);

    std::env::set_var("RUST_LOG", &log_level);
    env_logger::init();

    //let conn_users = Arc::new(Mutex::new(HashMap::<String, String>::new()));

    let login = warp::post().and(warp::path("register"))
                            .and(warp::body::json())
                            .map(|login_params: LoginParams| {
                                println!("{:#?}", login_params);
                                // TODO: Need a login handler and a websocket endpoint
                                // When a user logs in, they will be given an auth token which can be used to hain access to
                                // chat and video for as long as the session maintains activity
                                warp::reply()
                            });

    // This is the main entry point to the application
    // Notr the relative path.  The path is relative to where you are executing/launching khadga
    // from.  In this case, if we run `cargo run`, this path will work.  However, if we run like
    // `./target/debug/khadga`  it will not.  But, if we cd to target, then run `./debug/khadga`
    // it will work.  This is confusing, and something to keep in mind.
    let start = warp::path("start").and(warp::fs::dir("./dist"));

    let app = login.or(start);

    let host: SocketAddr = khadga_addr.parse()
                                      .expect(&format!("Could not parse {}", khadga_addr));
    warp::serve(app).run(host).await;
    println!("Ended service");
}
