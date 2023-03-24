#!/bin/sh
export IMAGE=redis/redis-stack:7.0.6-RC8

# It should be possible to do this elegantly with --filter, but I couldn't get it to work
docker rm $(docker stop $(docker ps -a | grep ${IMAGE} | awk '{print $1}'))

# This will error if redis isn't running, so lots of room for improvement!
