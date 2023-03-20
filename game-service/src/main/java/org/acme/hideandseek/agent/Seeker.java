package org.acme.hideandseek.agent;

import io.quarkus.redis.datasource.RedisDataSource;
import io.quarkus.redis.datasource.geo.GeoUnit;
import io.quarkus.redis.datasource.list.KeyValue;
import io.quarkus.redis.datasource.list.ListCommands;
import io.quarkus.redis.datasource.pubsub.PubSubCommands;
import org.acme.hideandseek.Player;
import org.jboss.logging.Logger;

import java.time.Duration;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Iterator;
import java.util.List;

public class Seeker implements Runnable {
    protected final static Logger LOGGER = Logger.getLogger("Seeker");

    public final Player player;
    protected final ListCommands<String, Event> queues;
    private final Iterator<String> placesToVisit;
    public final String inbox;
    protected final String game;
    protected final RedisDataSource redis;
    protected final PubSubCommands<GameEvent> events;
    protected String position;

    protected volatile boolean done;

    public Seeker(Player player, String gameId, List<String> places, RedisDataSource redis) {
        this.player = player;
        this.inbox = gameId + ":seeker";
        this.game = gameId;
        this.redis = redis;

        var copy = new ArrayList<>(places);
        Collections.shuffle(places);
        this.placesToVisit = copy.iterator();
        this.queues = redis.list(Event.class);
        this.events = redis.pubsub(GameEvent.class);
    }

    public void start() {
        Thread.ofVirtual().start(this);
    }

    public void run() {
        while (true) {
            KeyValue<String, Event> kv = queues.blpop(Duration.ofSeconds(1), inbox);
            if (kv != null) {
                var event = kv.value;
                switch (event.kind) {
                    case GAME_STARTED -> {
                        this.position = event.place;
                        goToPlace(placesToVisit.next());
                    }
                    case GAME_ENDED -> {
                        this.done = true;
                        return;
                    }
                    case SEEKER_ARRIVED -> {
                        this.position = event.place;
                        queues.lpush(game, Event.seekerAtPosition(event.place));
                        if (placesToVisit.hasNext()) {
                            goToPlace(placesToVisit.next());
                        }
                    }
                }
            }
        }
    }

    private void goToPlace(String destination) {
        var distance = redis.geo(String.class).geodist("places_geo", position, destination, GeoUnit.M);
        var duration = (int) (distance.orElse(0.0) / player.speed());
        LOGGER.infof("%s (seeker) wants to go from  %s to %s, the distance is %sm, it will take %sms", player.name(), position, destination, distance.orElse(0.0), duration);
        this.events.publish("game-events", new GameEvent(GameEvent.Kind.SEEKER_MOVE, game, player.name(), position, destination, distance.orElse(0.0), duration));
        Thread.ofVirtual().start(() -> {
            try {
                Thread.sleep(duration);
                if (! done) {
                    queues.lpush(inbox, Event.seekerArrivedAt(destination));
                }
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        });
    }

}
