#!/bin/sh
export IMAGE=redis/redis-stack:7.0.6-RC8
docker run -d --name redis-stack -p 6379:6379 -p 8001:8001 ${IMAGE}