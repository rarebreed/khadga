
use warp::Filter;

fn main() {
    env_logger::init();

    let hi = warp::path("hi").map(|| "Hello, World!");

    let readme = warp::get2()
        .and(warp::path::end())
        .and(warp::fs::file("../vision/static/index.html"));

    // dir already requires GET...
    let examples = warp::path("start").and(warp::fs::dir("../vision/dist/"));

    // GET / => README.md
    // GET /ex/... => ./examples/..
    let routes = readme.or(examples).or(hi);

    warp::serve(routes).run(([127, 0, 0, 1], 7001));
}