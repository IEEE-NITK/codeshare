docker build -t test . > /dev/null 2>&1
docker run -v `pwd`/$1:/codeshare-sandbox/files test &> $1/output