FROM alpine:3.7

WORKDIR /codeshare-sandbox

RUN apk add --no-cache bash
RUN apk add --no-cache procps
RUN apk add --no-cache build-base

COPY run.sh .

ENTRYPOINT ["bash", "run.sh"]
