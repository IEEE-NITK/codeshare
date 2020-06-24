FROM openjdk:7-alpine

WORKDIR /codeshare-sandbox

RUN apk add --no-cache bash
RUN apk add --no-cache procps

COPY run.sh .

ENTRYPOINT ["bash", "run.sh"]
