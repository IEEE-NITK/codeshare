docker run --cpus=1 -v `pwd`/$1:/codeshare-sandbox/files $2 &> $1/output &
DOCKER_PID=$!
sleep 2s
if ps -p $DOCKER_PID > /dev/null
then
    echo "CODESHARE: Program took too long to run.. Exiting now." >> $1/output
    kill $DOCKER_PID
fi