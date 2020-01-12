# TODO: convert this to a build.rs "script"
cargo +nightly fmt

cd vision
npm run build

cd ../khadga
cargo build
cargo test

cd ..
sudo docker build -t stoner/khadga:latest .