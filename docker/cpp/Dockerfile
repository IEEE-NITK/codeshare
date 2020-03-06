FROM iron/gcc:dev

WORKDIR /codeshare-sandbox

RUN apk add --no-cache bash

COPY run.sh .

ENTRYPOINT ["bash", "run.sh"]