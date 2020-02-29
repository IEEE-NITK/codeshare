FROM iron/gcc:dev

WORKDIR /codeshare-sandbox

RUN apk add --no-cache bash

COPY test.sh .

# RUN apt-get install -y bash
ENTRYPOINT ["bash", "test.sh"]