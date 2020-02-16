FROM fedora:31

RUN dnf update -y \
    && dnf upgrade -y \
    && dnf install -y curl openssl-devel \
    && dnf groupinstall -y "Development Tools" \
    && dnf groupinstall -y "C Development Tools and Libraries" \
    && dnf clean all -y \
    && mkdir -p /apps

# TODO: create a khadga user and run as that user.  We don't need to run as root

# Install rust tools
# Strictly speaking this isn't necessary for runtime.  Adding these will create 
# a container that lets us build khadga
RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs > rustup.sh \
    && sh rustup.sh -y \
    && source ~/.cargo/env \
    && rustup update \
    && cargo install wasm-pack

# Install node tools
RUN curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.35.2/install.sh | bash
RUN source ~/.bashrc \
    && nvm install 13 \
    && nvm use 13 \
    && mkdir /apps/bundle

# TODO: either clone the remote repo, or copy the entire khadga project over.
# In the "build locally" version, we assume that we've built khadga on our dev machine
# but we could also build it in the docker container itself.  Instead of doing a COPY
# we could do a MOUNT
COPY ./khadga /apps/khadga
COPY ./vision /apps/vision
COPY ./noesis /apps/noesis
COPY ./build-docker.sh /apps
WORKDIR /apps

CMD [ "./build-docker.sh" ]