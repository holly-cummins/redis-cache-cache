package org.acme.hideandseek.superseeker;

import io.quarkus.redis.datasource.RedisDataSource;
import io.quarkus.redis.datasource.geo.GeoSearchArgs;
import io.quarkus.redis.datasource.geo.GeoValue;
import io.quarkus.redis.datasource.graph.GraphQueryResponseItem;
import io.quarkus.redis.datasource.list.KeyValue;
import io.quarkus.runtime.Startup;
import org.acme.hideandseek.model.Event;
import org.acme.hideandseek.model.Player;
import org.jboss.logging.Logger;

import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Random;
import java.util.stream.Collectors;

import static io.quarkus.redis.datasource.geo.GeoUnit.M;

@Startup
public class SuperSeeker implements Runnable {

    public static final String QUERY = """
            MATCH (:Place {name:'%s'})-[r]->(m) WHERE NOT m.name in %s RETURN m.name AS place, r.distance AS distance ORDER BY r.distance ASC LIMIT 1
            """;


    private final static Logger LOGGER = Logger.getLogger("Super Seeker");
    private final static String SEEKER_KEY = "hide-and-seek:seeker";

    private final RedisDataSource redis;
    private final PlaceRepository repository;

    // ---- Game session ----
    private Player player;
    private volatile String game;
    private String position;
    private final List<String> visited = new ArrayList<>();

    public SuperSeeker(PlaceRepository repository, RedisDataSource redis) {
        this.redis = redis;
        this.repository = repository;

        var places = repository.getPlaceNames();
        for (String p : places) {
            var list = redis.geo(String.class).geosearch("hide-and-seek:geo",
                    new GeoSearchArgs<String>().fromMember(p)
                            .byRadius(100_000, M) // So, distances are given in m
                            .withDistance()
                            .withCoordinates());

            for (GeoValue<String> geoValue : list) {
                this.redis.graph().graphQuery("hide-and-seek:graph", """
                                        MERGE (:Place {name:'%s'})-[:travel{distance:%f}]->(:Place {name:'%s'})
                                        """.formatted(p, geoValue.distance.orElse(0.0),
                        geoValue.member)
                );

            }
        }

        LOGGER.infof("Starting super seeker");
        Thread.ofVirtual().start(this);
    }

    public void run() {
        while (true) {
            KeyValue<String, Event> kv = redis.list(Event.class).blpop(Duration.ofSeconds(1), SEEKER_KEY);
            if (kv != null) {
                var event = kv.value;
                switch (event.kind) {
                    case GAME_STARTED -> {
                        var gse = event.as(Event.GameStartedEvent.class);
                        LOGGER.infof("Received game started event (%s). The seeker is %s", gse.gameId, gse.seeker.name());
                        this.player = gse.seeker;
                        this.game = gse.gameId;
                        var places = repository.getPlaceNames();
                        // Pick a random starting point
                        this.position = places.get(new Random().nextInt(places.size() - 1));
                        visited.add(this.position);
                        redis.list(Event.SeekerAtPositionEvent.class).lpush("hide-and-seek:game:"+ game, new Event.SeekerAtPositionEvent(game, this.position));
                        goToPlace(pickNext());
                    }
                    case GAME_ENDED -> {
                        LOGGER.infof("The game is complete");
                        this.game = null;
                        this.player = null;
                        this.visited.clear();
                    }
                    case SEEKER_ARRIVED -> {
                        if (game != null) {
                            this.position = event.as(Event.SeekerArrivedAtEvent.class).place;
                            visited.add(this.position);
                            redis.list(Event.SeekerAtPositionEvent.class).lpush("hide-and-seek:game:"+ game, new Event.SeekerAtPositionEvent(game, this.position));
                            goToPlace(pickNext());
                        }
                    }
                }
            }
        }
    }

    record NextHop(String destination, double distance) {
    }

    private NextHop pickNext() {
        String v = visited.stream().map(s -> "'" + s + "'").collect(Collectors.joining(", "));
        String q = QUERY.formatted(this.position, "[" + v + "]");
        LOGGER.infof("Seeker query: %s", q);
        List<Map<String, GraphQueryResponseItem>> x = redis.graph().graphQuery("hide-and-seek:graph", q);
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
        redis.list(Event.SeekerMoveEvent.class).lpush("hide-and-seek:game:"+ game, new Event.SeekerMoveEvent(game, this.position, next.destination, duration, next.distance));
        Thread.ofVirtual().start(() -> {
            try {
                Thread.sleep(duration);
                if (game != null) {
                    redis.list(Event.SeekerArrivedAtEvent.class).lpush(SEEKER_KEY, new Event.SeekerArrivedAtEvent(game, next.destination));
                }
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        });
    }

}
