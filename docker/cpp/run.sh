#!/bin/bash

mv files/code files/code.cpp
g++ files/code.cpp -o executable  &> output
if [[ $? -ne 0 ]]; then
    mv output files/output
    exit 145 # Compilation error. Terminate.
fi
# ./executable < files/input
./executable &> output &

CPP_PID=$!
sleep 2s
if ps -p $CPP_PID > /dev/null
then
    kill $CPP_PID
    echo "CODESHARE: Program took too long to run.. Exiting now." >> output
fi

mv output files/output