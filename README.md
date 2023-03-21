# Redis Cache Cache

## Running instructions

### Prerequisites

- Apache Maven
- Java 19
- Docker

First, start Redis using `./start-redis`

### UI

```shell
> cd frontend
> mvn clean package
> java --enable-preview -jar target/quarkus-app/quarkus-run.jar
```

Alternatively, for live reload during UI development, use `quarkus dev`

The UI is available on http://localhost:8080/.

### Player service

```shell
> mvn clean package
> java -jar target/quarkus-app/quarkus-run.jar
```

### Place service

```shell
> mvn clean package
> java -jar target/quarkus-app/quarkus-run.jar
```

### Leaderboard service

```shell
> mvn clean package
> java --enable-preview -jar target/quarkus-app/quarkus-run.jar
```

### Monitoring service

```shell
> mvn clean package
> java --enable-preview -jar target/quarkus-app/quarkus-run.jar
```

### Game service

```shell
> mvn clean package
> java --enable-preview -jar target/quarkus-app/quarkus-run.jar
```

### Seeker Service

You can run only one seeker at a time.
So pick one:

- seeker-service - random pick of the next destination
- super-seeker-service - graph based decision to always select the closest destination

```shell
> mvn clean package
> java --enable-preview -jar target/quarkus-app/quarkus-run.jar
```

### HTTP commands

1. Start a game: `http POST :8091/games`
2. Game event stream `http :8091/games/events`
3. Monitoring event stream `http :8094/monitoring`


