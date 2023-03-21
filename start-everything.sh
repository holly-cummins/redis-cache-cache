#!/bin/sh

mvn clean package

# Start redis in a container

./start-redis.sh

# Launch each service. Good luck finding them all again to stop them. :)

(cd frontend && java --enable-preview -jar target/quarkus-app/quarkus-run.jar & )
(cd player-service && java --enable-preview -jar target/quarkus-app/quarkus-run.jar & )
(cd place-service && java --enable-preview -jar target/quarkus-app/quarkus-run.jar & )
(cd leaderboard-service && java --enable-preview -jar target/quarkus-app/quarkus-run.jar & )
(cd game-monitoring-service && java --enable-preview -jar target/quarkus-app/quarkus-run.jar & )
(cd game-service && java --enable-preview -jar target/quarkus-app/quarkus-run.jar & )
(cd seeker-service && java --enable-preview -jar target/quarkus-app/quarkus-run.jar & )

# Give services a chance to initialise before starting the game
sleep 5

# Start a game
curl -X POST http://localhost:8091/games
