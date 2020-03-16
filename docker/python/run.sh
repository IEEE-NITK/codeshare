#!/bin/bash

mv files/code files/code.py
python3 files/code.py &> output &

PYTHON_PID=$!
sleep 5s
if ps -p $PYTHON_PID > /dev/null
then
    kill $PYTHON_PID
    echo "CODESHARE: Program took too long to run.. Exiting now." >> output
fi

mv output files/output