#Dockerfile for CI (bamboo is configured to look at root)
FROM node:6.11.3

WORKDIR /app

ADD . /app/

RUN cd /app && npm install -q

CMD npm run ci
