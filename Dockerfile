FROM fedora:31

RUN dnf update -y \
    && dnf upgrade -y \
    && dnf clean all -y

RUN mkdir -p /apps/vision/dist \ 
    && chgrp -R 0 /apps \
    && chmod -R g=u /apps

# Copy the dist that was generated from wasm-pack and webpack to our working dir
# then, copy the executable to the vision directory.  This is because the binary
# is serving files from ./dist
WORKDIR /apps/vision
COPY vision/dist ./dist
COPY khadga/config ./config
COPY target/debug/khadga .

VOLUME [ "/apps/vision/dist" ]

CMD [ "./khadga" ]