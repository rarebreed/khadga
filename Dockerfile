FROM ubuntu:bionic

RUN apt update \
    && apt upgrade -y \
    && apt install -y curl \
    && mkdir -p /apps/vision/dist

# TODO: create a khadga user and run as that user.  We don't need to run as root

# Copy the dist that was generated from wasm-pack and webpack to our working dir
# then, copy the executable to the vision directory.  This is because the binary
# is serving files from ../vision/dist
WORKDIR /apps/vision
COPY vision/dist ./dist
COPY target/debug/khadga .

CMD [ "./khadga" ]