package org.acme.hideandseek.seeker;

import io.quarkus.redis.datasource.RedisDataSource;
import io.quarkus.redis.datasource.geo.GeoUnit;
import io.quarkus.redis.datasource.list.KeyValue;
import io.quarkus.redis.datasource.list.ListCommands;
import io.quarkus.runtime.Startup;
import org.acme.hideandseek.model.Event;
import org.acme.hideandseek.model.Player;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

import java.time.Duration;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Iterator;

@Startup
public class Seeker implements Runnable {

    private final static String SEEKER_KEY = "hide-and-seek:seeker";
    private final static Logger LOGGER = Logger.getLogger("Seeker");

    private final ListCommands<String, Event> queues;
    private Iterator<String> placesToVisit;
    private final RedisDataSource redis;
    private final PlaceRepository repository;

    // ---- Game session ----
    private Player player;
    private volatile String game;
    private String position;


    public Seeker(PlaceRepository repository, RedisDataSource redis,
                  @ConfigProperty(name = "hide-and-seek.seeker-initial-position", defaultValue = "Devoxx")
                  String initialPosition) {
        this.redis = redis;
        this.repository = repository;

        this.queues = redis.list(Event.class);

        this.position = initialPosition;
        LOGGER.infof("Starting seeker");
        Thread.ofVirtual().start(this);
    }

    public void run() {
        while (true) {
            // Actor-Style
            KeyValue<String, Event> kv
                    = queues.blpop(Duration.ofSeconds(1), SEEKER_KEY);
            if (kv != null) {
                var event = kv.value;
                switch (event.kind) {
                    case GAME_STARTED -> {
                        var ev = event.as(Event.GameStartedEvent.class);
                        if (this.game == null) {
                            LOGGER.infof("Received game started event (%s). " +
                                    "The seeker is %s", ev.gameId, ev.seeker.name());
                            var copy = new ArrayList<>(repository.getPlaceNames());
                            Collections.shuffle(copy);
                            this.placesToVisit = copy.iterator();
                            this.player = ev.seeker;
                            this.game = ev.gameId;
                            goToPlace(placesToVisit.next());
                        }
                    }

                    case GAME_ENDED -> {
                        var ev = event.as(Event.GameEndedEvent.class);
                        if (ev.gameId.equals(this.game)) {
                            LOGGER.infof("The game is complete");
                            this.game = null;
                            this.player = null;
                            this.placesToVisit = null;
                        }
                    }

                    case SEEKER_ARRIVED -> {
                        var ev = event.as(Event.SeekerArrivedAtEvent.class);
                        if (ev.gameId.equals(this.game)) {
                            this.position = ev.place;
                            var positionEvent = new Event.SeekerAtPositionEvent(game, this.position);
                            redis.list(Event.SeekerAtPositionEvent.class)
                                    .lpush("hide-and-seek:game", positionEvent);
                            if (placesToVisit.hasNext()) {
                                goToPlace(placesToVisit.next());
                            }
                        }
                    }
                }
            }
        }
    }

    private void goToPlace(String destination) {
        // Compute the distance between the current position and the picked destination
        var distance = redis.geo(String.class)
                .geodist("hide-and-seek:geo", position, destination, GeoUnit.M);
        var duration = (int) (distance.orElse(0.0) / player.speed());
        LOGGER.infof("%s (seeker) wants to go from  %s to %s, the distance is %sm, " +
                "it will take %sms", player.name(), position, destination, distance.orElse(0.0), duration);

        // Send the move event
        redis.list(Event.SeekerMoveEvent.class).lpush("hide-and-seek:game",
                new Event.SeekerMoveEvent(game, this.position, destination, duration,
                        distance.orElse(0.0)));

        Thread.ofVirtual().start(() -> {
            try {
                Thread.sleep(duration);
                if (game != null) {
                    // Send the moved event
                    redis.list(Event.SeekerArrivedAtEvent.class).lpush(SEEKER_KEY,
                            new Event.SeekerArrivedAtEvent(game, destination));
                }
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        });
    }

}
