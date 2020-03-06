#!/bin/bash

mv files/code files/code.java
javac -d . files/code.java
if [[ $? -ne 0 ]]; then
    exit 145 # Compilation error. Terminate.
fi
# ./executable < files/input
java code