#!/bin/bash

mv files/code files/code.c
gcc files/code.c -o executable &> output
if [[ $? -ne 0 ]]; then
    mv output files/output
    exit 145 # Compilation error. Terminate.
fi
# ./executable < files/input
./executable &>> output &

C_PID=$!
sleep 2s
if ps -p $C_PID > /dev/null
then
    kill $C_PID
    echo "CODESHARE: Program took too long to run.. Exiting now." >> output
fi

mv output files/output