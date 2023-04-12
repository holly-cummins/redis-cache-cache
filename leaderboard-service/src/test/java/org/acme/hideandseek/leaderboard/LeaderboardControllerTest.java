package org.acme.hideandseek.leaderboard;

import io.quarkus.redis.datasource.RedisDataSource;
import io.quarkus.redis.datasource.sortedset.ScoredValue;
import io.quarkus.test.common.http.TestHTTPResource;
import io.quarkus.test.junit.QuarkusTest;
import io.restassured.RestAssured;
import io.restassured.common.mapper.TypeRef;
import jakarta.ws.rs.client.Client;
import jakarta.ws.rs.client.ClientBuilder;
import jakarta.ws.rs.client.WebTarget;
import jakarta.ws.rs.core.GenericType;
import jakarta.ws.rs.sse.SseEventSource;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import java.util.List;
import java.util.Map;
import java.util.OptionalInt;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicReference;

import static org.acme.hideandseek.leaderboard.LeaderboardService.KEY;
import static org.acme.hideandseek.leaderboard.LeaderboardService.TOPIC_EVENTS;
import static org.awaitility.Awaitility.await;

@QuarkusTest
class LeaderboardControllerTest {


    @Autowired
    RedisDataSource redis;

    @TestHTTPResource("/leaderboard/events")
    String url;

    @BeforeEach
    void clear() {
        redis.key().del(KEY);
    }

    @Test
    void testGet() {
        var list = RestAssured.get("/leaderboard")
                .then()
                .statusCode(200)
                .extract().response().as(new TypeRef<List<ScoredValue<String>>>() {
                });

        Assertions.assertEquals(0, list.size());

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
            var res = RestAssured.get("/leaderboard")
                    .then()
                    .statusCode(200)
                    .extract().response().as(new TypeRef<List<ScoredValue<String>>>() {
                    });

            Assertions.assertEquals(2, res.size());

            Assertions.assertEquals("clement", res.get(0).value);
            Assertions.assertEquals(2, res.get(0).score);
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
            var res = RestAssured.get("/leaderboard")
                    .then()
                    .statusCode(200)
                    .extract().response().as(new TypeRef<List<ScoredValue<String>>>() {
                    });

            Assertions.assertTrue(res.size() >= 2);
            Assertions.assertEquals(4, res.get(0).score);
            Assertions.assertEquals("clement", res.get(0).value);
            Assertions.assertEquals(3, res.get(1).score);
            Assertions.assertEquals("roxanne", res.get(1).value);
        });
    }

    @Test
    void testSSE() {
        AtomicReference<List<ScoredValue<String>>> reference = new AtomicReference<>();
        Client client = ClientBuilder.newClient();
        WebTarget target = client.target(url);
        var sse = SseEventSource.target(target).reconnectingEvery(5, TimeUnit.SECONDS).build();
        sse.register(ev -> {
            List<ScoredValue<String>> sv = ev.readData(new GenericType<List<ScoredValue<String>>>(){});
            reference.set(sv);
        });
        sse.open();

        await().until(sse::isOpen);

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
