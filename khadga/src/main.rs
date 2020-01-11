use actix_files as fs;
use actix_web::{middleware,
                web,
                App,
                HttpServer};
use khadga::auth::login;

#[actix_rt::main]
async fn main() -> std::io::Result<()> {
    std::env::set_var("RUST_LOG", "actix_web=debug");
    env_logger::init();

    HttpServer::new(|| {
        App::new().wrap(middleware::Logger::default())
                  .configure(app_config)
    }).bind("127.0.0.1:7001")?
      .run()
      .await
}

fn app_config(config: &mut web::ServiceConfig) {
    config.service(
        web::scope("")
            .service(login)
            .service(fs::Files::new("/", "./dist").index_file("index.html")),
    );
}
