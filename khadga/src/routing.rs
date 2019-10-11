use hyper::{
  Body, Request, Response
};

/// TODO: Make this smarter.  Validate on path, method type, and header Content-Type
pub fn validate_route(path: &str, req: Request<Body>) -> Result<Request<Body>, Response<Body>> {
  let uri = req.uri().path();
  if uri == path { 
    Ok(req) 
  } else { 
    let resp = Response::builder()
      .status(400)
      .body(Body::from("Invalid path")).unwrap();
    Err(resp)
  }
}