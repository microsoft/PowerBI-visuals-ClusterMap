#Dockerfile for CI (bamboo is configured to look at root)
FROM node:4.2.6

WORKDIR /app

ADD package.json .npmrc /dependencies/

RUN cd /dependencies && npm install -q

CMD ./personas.sh --ci -b