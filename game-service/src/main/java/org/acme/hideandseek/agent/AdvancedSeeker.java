package org.acme.hideandseek.agent;

import io.quarkus.redis.datasource.RedisDataSource;
import io.quarkus.redis.datasource.geo.GeoSearchArgs;
import io.quarkus.redis.datasource.geo.GeoValue;
import io.quarkus.redis.datasource.graph.GraphQueryResponseItem;
import io.quarkus.redis.datasource.list.KeyValue;
import org.acme.hideandseek.Player;

import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Random;
import java.util.stream.Collectors;

import static io.quarkus.redis.datasource.geo.GeoUnit.M;

public class AdvancedSeeker extends Seeker implements Runnable {

    public static final String QUERY = """
            MATCH (:Place {name:'%s'})-[r]->(m) WHERE NOT m.name in %s RETURN m.name AS place, r.distance AS distance ORDER BY r.distance ASC LIMIT 1
            """;

    private final String key;
    private final List<String> visited = new ArrayList<>();

    public AdvancedSeeker(Player player, String gameId, List<String> places, RedisDataSource redis) {
        super(player, gameId, places, redis);
        // Pick a random starting point
        this.position = places.get(new Random().nextInt(places.size() -1));
        this.key = gameId + ":seeker-graph";
        for (String p : places) {
            var list = redis.geo(String.class).geosearch("places_geo",
                    new GeoSearchArgs<String>().fromMember(p)
                            .byRadius(100_000, M) // So, distances are given in m
                            .withDistance()
                            .withCoordinates());

            for (GeoValue<String> geoValue : list) {
                this.redis.graph().graphQuery(key, """
                MERGE (:Place {name:'%s'})-[:travel{distance:%f}]->(:Place {name:'%s'})
                """.formatted(p, geoValue.distance.orElse(0.0),
                        geoValue.member)
                );

            }
        }
    }

    public void run() {
        while (true) {
            KeyValue<String, Event> kv = queues.blpop(Duration.ofSeconds(1), inbox);
            if (kv != null) {
                var event = kv.value;
                switch (event.kind) {
                    case GAME_STARTED -> {
                        visited.add(this.position);
                        queues.lpush(game, Event.seekerAtPosition(this.position));
                        goToPlace(pickNext());
                    }
                    case GAME_ENDED -> {
                        this.done = true;
                        return;
                    }
                    case SEEKER_ARRIVED -> {
                        this.position = event.place;
                        visited.add(this.position);
                        queues.lpush(game, Event.seekerAtPosition(event.place));
                            goToPlace(pickNext());
                    }
                }
            }
        }
    }

    record NextHop(String destination, double distance) {}

    private NextHop pickNext() {
        String v = visited.stream().map(s -> "'" + s + "'").collect(Collectors.joining(", "));
        String q = QUERY.formatted(this.position, "[" + v + "]");
        LOGGER.infof("Seeker query: %s", q);
        List<Map<String, GraphQueryResponseItem>> x = redis.graph().graphQuery(key, q);
        if (x.isEmpty()) {
            return null;
        } else {
            String s = x.get(0).get("place").asScalarItem().asString();
            double d = x.get(0).get("distance").asScalarItem().asDouble();
            return new NextHop(s, d);
        }
    }

    private void goToPlace(NextHop next) {
        if (next == null) {
            // Nowhere to do...
            return;
        }
        var duration = (int) (next.distance / player.speed());
        LOGGER.infof("%s (seeker) wants to go from  %s to %s, the distance is %sm, it will take %sms", player.name(), position, next.destination, next.distance, duration);
        this.events.publish("game-events", new GameEvent(GameEvent.Kind.SEEKER_MOVE, game, player.name(), position, next.destination, next.distance, duration));
        Thread.ofVirtual().start(() -> {
            try {
                Thread.sleep(duration);
                if (! done) {
                    queues.lpush(inbox, Event.seekerArrivedAt(next.destination));
                }
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        });
    }

}
