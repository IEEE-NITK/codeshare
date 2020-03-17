#!/bin/bash

mv files/code files/code.java
javac -d . files/code.java  &> output
if [[ $? -ne 0 ]]; then
    mv output files/output
    exit 145 # Compilation error. Terminate.
fi
# ./executable < files/input
java code &> output &

JAVA_PID=$!
sleep 2s
if ps -p $JAVA_PID > /dev/null
then
    kill $JAVA_PID
    echo "CODESHARE: Program took too long to run.. Exiting now." >> output
fi

mv output files/output