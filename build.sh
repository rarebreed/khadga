# TODO: convert this to a build.rs "script"
PUBLISH=false
if [ $# -eq 1 ]; then
	PUBLISH=$1
fi

cargo +nightly fmt

cd noesis
wasm-pack build
if [[ ${PUBLISH} == "true" ]]; then
  wasm-pack test --firefox
	echo "Deploying noesis to npm"
	npm login
	wasm-pack publish
fi

cd ../vision
npm run clean
npm run build
npx test

cd ../khadga
cargo build
KHADGA_DEV=true cargo test

cd ..
sudo docker build -t khadga .

if [ $# -ne 4 ]; then
  echo "Usage: ./build.sh CLUSTER_NAME ZONE PROJECT TAG"
	exit
fi

CLUSTER_NAME=$1
ZONE=$2
PROJECT=$3
TAG=$4

gcloud auth configure-docker
gcloud config set project $PROJECT
gcloud auth login
gcloud container clusters get-credentials $CLUSTER_NAME --zone $ZONE --project $PROJECT
sudo docker tag khadga gcr.io/$PROJECT/khadga:${TAG}
sudo docker push gcr.io/${PROJECT}/khadga:${TAG}