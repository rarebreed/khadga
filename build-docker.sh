#!/bin/sh
ls -al
cd vision
source ~/.bashrc
npm install
npm run clean
npm run build
npx jest

cd ../khadga
source ~/.cargo/env
cargo build
# cargo test

# Copy the khadga binary, the vision/dist and khadga/config
cd ..
cp -r ./vision/dist ./bundle
cp ./khadga/target/debug/khadga ./bundle
cp -r ./khadga/config ./bundle
tar czvf ./bundle.tar.gz ./bundle