FROM iron/java:1.8-dev

WORKDIR /codeshare-sandbox

RUN apk add --no-cache bash

COPY run.sh .

ENTRYPOINT ["bash", "run.sh"]