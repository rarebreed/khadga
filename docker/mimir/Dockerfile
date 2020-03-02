FROM node:13-stretch 

RUN apt update -y \
    && apt upgrade -y \
		&& mkdir -p /apps/mimir

COPY ./mimir/package.json /apps/mimir

WORKDIR /apps/mimir
RUN npm install

COPY ./mimir .

CMD [ "npm", "run", "start" ]