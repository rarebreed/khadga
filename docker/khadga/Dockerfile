FROM fedora:31 as builder

RUN dnf update -y \
    && dnf upgrade -y \
    && dnf install -y curl openssl-devel libpq-devel libpq \
    && dnf groupinstall -y "Development Tools" \
    && dnf groupinstall -y "C Development Tools and Libraries" \
    && dnf clean all -y \
    && mkdir -p /apps/vision

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
    && mkdir -p /apps/bundle \
    && mkdir -p /src

# Copy all the source needed for building
COPY ./khadga /src/khadga
COPY ./vision /src/vision
COPY ./noesis /src/noesis
COPY ./build-docker.sh /src
WORKDIR /src

RUN source ~/.bashrc \
    && source ~/.cargo/env \
    && ./build-docker.sh \
    && ls -al

# Clean up the source to reduce image size
RUN rm -rf /src

FROM fedora:31

RUN dnf update -y \
    && dnf upgrade -y \
    && dnf install -y libpq \
    && dnf clean all

RUN mkdir -p /apps/vision

COPY --from=builder /apps/vision /apps/vision

WORKDIR /apps/vision
VOLUME /apps/vision

EXPOSE 7001

CMD [ "./khadga" ]