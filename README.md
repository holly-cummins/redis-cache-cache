# Redis Cache Cache

## Running instructions

### Prerequisites

- Apache Maven
- Java 19
- Docker

First, start Redis using `./start-redis`

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

### HTTP commands

1. Start a game: `http POST :8091/games`
2. Game event stream `http :8091/games/events`
3. Monitoring event stream `http :8094/monitoring`


