package org.acme.hideandseek;

import io.quarkus.redis.datasource.ReactiveRedisDataSource;
import io.quarkus.redis.datasource.RedisDataSource;
import io.smallrye.mutiny.Multi;
import org.acme.hideandseek.actors.Game;
import org.acme.hideandseek.model.GameEvent;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;

import java.time.Duration;

@RestController
public class GameController {

    private final PlayerRepository players;
    private final PlaceRepository places;
    private final RedisDataSource redis;
    private final Multi<GameEvent> events;

    @ConfigProperty(name = "hide-and-seek.game-duration", defaultValue = "10s")
    Duration maxGameDuration;

    public GameController(PlayerRepository players, PlaceRepository places,
                          ReactiveRedisDataSource reactiveRedis,
                          RedisDataSource redis) {
        this.players = players;
        this.places = places;
        this.redis = redis;
        this.events = Multi.createBy().merging().streams(
                reactiveRedis.pubsub(GameEvent.class).subscribe("hide-and-seek/events"),
                Multi.createFrom().ticks().every(Duration.ofSeconds(10)).map(x -> GameEvent.EMPTY)
        );
    }

    @PostMapping("/games")
    public String start() {
        Game game = new Game(players.getAllPlayers(), places.getPlaceNames(),
                redis, maxGameDuration);
        return game.start();
    }

    @GetMapping("/games/events")
    @Produces(MediaType.SERVER_SENT_EVENTS)
    public Multi<GameEvent> getEvents() {
        return events;
    }
}
