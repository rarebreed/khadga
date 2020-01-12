use actix_files as fs;
use actix_web::{middleware,
                web,
                App,
                HttpServer};
use khadga::{auth::login,
             config::Settings};

#[actix_rt::main]
async fn main() -> std::io::Result<()> {
    let config = match Settings::new() {
        Ok(cfg) => cfg,
        Err(_) => panic!("Could not read config file"),
    };
    let log_level = format!("actix_web={}", config.logging.level.repr());
    let khadga_host_port = format!("{}:{}",
                                   config.services.khadga.host, config.services.khadga.port);

    std::env::set_var("RUST_LOG", &log_level);
    env_logger::init();

    HttpServer::new(|| {
        App::new().wrap(middleware::Logger::default())
                  .configure(app_config)
    }).bind(&khadga_host_port)?
      .run()
      .await
}

fn app_config(config: &mut web::ServiceConfig) {
    config.service(web::scope("").service(login)
                                 .service(fs::Files::new("/", "./dist").index_file("index.html")));
}
