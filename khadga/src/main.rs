use hyper::{
  Body, Error, Response, Server,
  service::{
    make_service_fn,
    service_fn
  },
  server::conn::AddrStream
};

// This is super confusing in rust.  If you have both a lib.rs and a main.rs, you need to use the ::crate_name::module syntax
use ::khadga::routing;

#[tokio::main]
async fn main() {
  // Construct our SocketAddr to listen on...
  let addr = ([127, 0, 0, 1], 7001).into();

  // And a MakeService to handle each connection...
  let make_service = make_service_fn(|_sock: &AddrStream| async {
    Ok::<_, Error>(service_fn(|_req| async move {
      println!("{:#?}", _req);
      let valid = routing::validate_route("/hello", _req);
      match valid {
        Ok(_r) => {
          Ok::<_, Error>(Response::new(Body::from("Hello World")))
        },
        Err(resp) => {
          Ok(resp)
        }
      }
    }))
  });

  // Then bind and serve...
  let server = Server::bind(&addr)
    .serve(make_service);

  // Finally, spawn `server` onto an Executor...
  if let Err(e) = server.await {
    eprintln!("server error: {}", e);
  }
}
