#!/bin/bash

function cleanup {
    kill $STREAM_PID
    kill $SERVER_PID
}

trap cleanup EXIT

node stream.js &
STREAM_PID=$!

node server.js &
SERVER_PID=$!

while true; do sleep 99999999; done
