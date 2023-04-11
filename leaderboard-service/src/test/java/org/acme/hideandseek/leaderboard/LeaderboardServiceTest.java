package org.acme.hideandseek.leaderboard;

import io.quarkus.redis.datasource.RedisDataSource;
import io.quarkus.redis.datasource.sortedset.ScoredValue;
import io.quarkus.test.junit.QuarkusTest;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import java.util.List;
import java.util.Map;
import java.util.OptionalInt;
import java.util.concurrent.atomic.AtomicReference;

import static org.acme.hideandseek.leaderboard.LeaderboardService.KEY;
import static org.acme.hideandseek.leaderboard.LeaderboardService.TOPIC_EVENTS;
import static org.awaitility.Awaitility.await;

@QuarkusTest
class LeaderboardServiceTest {

    @Autowired
    LeaderboardService service;

    @Autowired
    RedisDataSource redis;

    @BeforeEach
    void clear() {
        redis.key().del(KEY);
    }

    @Test
    void testScoreComputation() {
        var empty = service.getLeaderboard();
        Assertions.assertEquals(0, empty.size());

        var event = new GameEvent();
        event.kind = GameEvent.Kind.GAME_OVER;
        event.seeker = "clement";
        event.hiders = Map.of("roxanne", "floor 2", "suzie", "floor 1");
        event.nonDiscoveredPlayers = OptionalInt.of(0);

        redis.pubsub(GameEvent.class).publish(TOPIC_EVENTS, event);

        await().until(() -> service.getLeaderboard().size() != 0);
        Assertions.assertEquals("clement", service.getLeaderboard().get(0).value);
        Assertions.assertEquals(2, service.getLeaderboard().get(0).score);
    }

    @Test
    void testScoreAccumulation() {
        var empty = service.getLeaderboard();
        Assertions.assertEquals(0, empty.size());

        var event = new GameEvent();
        event.kind = GameEvent.Kind.GAME_OVER;
        event.seeker = "clement";
        event.hiders = Map.of("roxanne", "floor 2", "suzie", "floor 1");
        event.nonDiscoveredPlayers = OptionalInt.of(0);
        redis.pubsub(GameEvent.class).publish(TOPIC_EVENTS, event);

        event.seeker = "roxanne";
        event.hiders = Map.of("clement", "floor 0", "suzie", "floor 1");
        event.nonDiscoveredPlayers = OptionalInt.of(1);
        redis.pubsub(GameEvent.class).publish(TOPIC_EVENTS, event);

        await().until(() -> service.getLeaderboard().size() != 0);
        Assertions.assertEquals("clement", service.getLeaderboard().get(0).value);
        Assertions.assertEquals(2, service.getLeaderboard().get(0).score);

        event.kind = GameEvent.Kind.GAME_OVER;
        event.seeker = "clement";
        event.hiders = Map.of("roxanne", "floor 2", "suzie", "floor 1");
        event.nonDiscoveredPlayers = OptionalInt.of(0);
        redis.pubsub(GameEvent.class).publish(TOPIC_EVENTS, event);

        event.seeker = "roxanne";
        event.hiders = Map.of("clement", "floor 0", "suzie", "floor 1");
        event.nonDiscoveredPlayers = OptionalInt.of(0);
        redis.pubsub(GameEvent.class).publish(TOPIC_EVENTS, event);


        await().until(() -> {
                    return service.getLeaderboard().size() >= 2
                            && service.getLeaderboard().get(0).score == 4
                            && service.getLeaderboard().get(1).score == 3;
                }
        );


        Assertions.assertEquals("clement", service.getLeaderboard().get(0).value);
        Assertions.assertEquals("roxanne", service.getLeaderboard().get(1).value);
    }

    @Test
    void testStream() {
        var empty = service.getLeaderboard();
        Assertions.assertEquals(0, empty.size());

        AtomicReference<List<ScoredValue<String>>> reference = new AtomicReference<>();
        service.getLeaderboardStream().subscribe()
                .with(reference::set);

        var event = new GameEvent();
        event.kind = GameEvent.Kind.GAME_OVER;
        event.seeker = "clement";
        event.hiders = Map.of("roxanne", "floor 2", "suzie", "floor 1");
        event.nonDiscoveredPlayers = OptionalInt.of(0);
        redis.pubsub(GameEvent.class).publish(TOPIC_EVENTS, event);

        event.seeker = "roxanne";
        event.hiders = Map.of("clement", "floor 0", "suzie", "floor 1");
        event.nonDiscoveredPlayers = OptionalInt.of(1);
        redis.pubsub(GameEvent.class).publish(TOPIC_EVENTS, event);

        await().untilAsserted(() -> {
            Assertions.assertNotNull(reference.get());
            Assertions.assertEquals("clement", reference.get().get(0).value);
            Assertions.assertEquals(2, reference.get().get(0).score);
        });


        event.kind = GameEvent.Kind.GAME_OVER;
        event.seeker = "clement";
        event.hiders = Map.of("roxanne", "floor 2", "suzie", "floor 1");
        event.nonDiscoveredPlayers = OptionalInt.of(0);
        redis.pubsub(GameEvent.class).publish(TOPIC_EVENTS, event);

        event.seeker = "roxanne";
        event.hiders = Map.of("clement", "floor 0", "suzie", "floor 1");
        event.nonDiscoveredPlayers = OptionalInt.of(0);
        redis.pubsub(GameEvent.class).publish(TOPIC_EVENTS, event);

        await().untilAsserted(() -> {
            Assertions.assertTrue(reference.get().size() >= 2);
            Assertions.assertEquals(4, reference.get().get(0).score);
            Assertions.assertEquals("clement", reference.get().get(0).value);
            Assertions.assertEquals(3, reference.get().get(1).score);
            Assertions.assertEquals("roxanne", reference.get().get(1).value);
        });
    }

}