# TODO: convert this to a build.rs "script"
cargo +nightly fmt

cd vision
npm run clean
npm run build
npx test

cd ../khadga
cargo build
KHADGA_DEV=true cargo test

cd ..
sudo docker build -t stoner/khadga:latest .