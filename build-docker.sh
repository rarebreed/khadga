ls -al
cd noesis
wasm-pack build
if [ "${PUBLISH}" = "true" ]; then
  wasm-pack test --firefox
	echo "Deploying noesis to npm"
	npm login
	wasm-pack publish
fi

cd ../vision
npm install
npm run clean
npm run build
npx jest

cd ../khadga
cargo build
# KHADGA_DEV=true cargo test
