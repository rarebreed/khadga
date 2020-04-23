ls -al
echo "Building noesis"
cd noesis
wasm-pack build
if [ "${PUBLISH}" = "true" ]; then
  wasm-pack test --firefox
	echo "Deploying noesis to npm"
	npm login
	wasm-pack publish
fi

echo "Building vision"
cd ../vision
rm -rf node_modules
npm install
npm run clean
npm run build
npx jest

cd ../khadga
echo "Building khadga"
cargo build --release
# KHADGA_DEV=true cargo test

# Copy all the artifacts
cd ..
echo "Copying artifacts. Now in ${PWD}"
ls -al khadga
cp -r vision/dist /apps/vision/dist
cp -r khadga/config /apps/vision/config
cp -r khadga/target/release/khadga /apps/vision
