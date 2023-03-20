package org.acme.hideandseek;

import io.quarkus.redis.datasource.ReactiveRedisDataSource;
import io.quarkus.redis.datasource.RedisDataSource;
import io.smallrye.mutiny.Multi;
import org.acme.hideandseek.actors.Game;
import org.acme.hideandseek.model.GameEvent;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.ws.rs.Produces;
import javax.ws.rs.core.MediaType;

@RestController
public class GameController {

    private final PlayerRepository players;
    private final PlaceRepository places;
    private final RedisDataSource redis;
    private final Multi<GameEvent> events;

    public GameController(PlayerRepository players, PlaceRepository places,
                          ReactiveRedisDataSource reactiveRedis,
                          RedisDataSource redis) {
        this.players = players;
        this.places = places;
        this.redis = redis;
        this.events = reactiveRedis.pubsub(GameEvent.class).subscribe("game-events");
    }

    @PostMapping("/games")
    public void start() {
        Game game = new Game(players.getAllPlayers(), places.getPlaceNames(), redis);
        game.start();
    }

    @GetMapping("/games/events")
    @Produces(MediaType.SERVER_SENT_EVENTS)
    public Multi<GameEvent> getEvents() {
        return events;
    }
}
