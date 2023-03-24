#!/bin/sh

# Use this script with caution. It will kill everything with 'quarkus' in the process name

pkill -f quarkus

# This will error if redis isn't running
./stop-redis.sh


