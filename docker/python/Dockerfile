FROM iron/python

WORKDIR /codeshare-sandbox

RUN apk add --no-cache bash

COPY run.sh .

ENTRYPOINT ["bash", "run.sh"]