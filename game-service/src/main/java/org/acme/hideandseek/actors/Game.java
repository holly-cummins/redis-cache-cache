package org.acme.hideandseek.actors;

import io.quarkus.redis.datasource.RedisDataSource;
import io.quarkus.redis.datasource.pubsub.PubSubCommands;
import org.acme.hideandseek.model.Event;
import org.acme.hideandseek.model.GameEvent;
import org.acme.hideandseek.model.Player;
import org.jboss.logging.Logger;

import java.time.Duration;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Random;
import java.util.UUID;


public class Game implements Runnable {

    private final static Logger LOGGER = Logger.getLogger("Game");
    private final static String SEEKER_KEY = "hide-and-seek:seeker";
    public static final String TOPIC_EVENTS = "hide-and-seek/events";
    public final String gameId = UUID.randomUUID().toString();
    private final PubSubCommands<GameEvent> events;
    private final List<Hider> hiders = new ArrayList<>();
    private final Player seeker;
    private final RedisDataSource redis;
    private final Duration maxGameDuration;

    private volatile boolean done;
    private volatile long begin;

    public Game(Collection<Player> players, List<String> places, RedisDataSource redis, Duration maxGameDuration) {
        // Redis objects
        // to read from the "game" queue and write to the "seeker" queue.
        this.redis = redis;
        this.maxGameDuration = maxGameDuration;

        // commands to broadcast events
        this.events = redis.pubsub(GameEvent.class);

        LOGGER.infof("New game with %d players and %d places", players.size(), places.size());
        LOGGER.infof("Initializing game %s", gameId);

        List<Player> copy = new ArrayList<>(players);
        Random random = new Random();
        // Pick random seeker
        int index = random.nextInt(copy.size() - 1);
        this.seeker = copy.get(index);

        // Others are going to hide
        copy.remove(this.seeker);
        for (Player player : copy) {
            Hider hider = new Hider(player, places);
            this.hiders.add(hider);
        }
    }

    public String start() {
        Thread.ofVirtual().start(this);
        return gameId;
    }

    public void run() {
        begin = System.currentTimeMillis();

        // Send game started event to the seeker
        this.redis.list(Event.GameStartedEvent.class)
                .lpush(SEEKER_KEY, new Event.GameStartedEvent(gameId, seeker));
        this.events.publish(TOPIC_EVENTS,
                GameEvent.newGame(gameId, seeker, hiders));
        initTimesUp();

        while (!done) {
            // Actor-Style: Read messages from the game queue
            var kv = redis.list(Event.class)
                    .blpop(Duration.ofSeconds(1), "hide-and-seek:game");
            if (kv != null) {
                var event = kv.value;
                if (event.gameId.equals(gameId)) {
                    switch (event.kind) {
                        case TIMES_UP -> onGameEnd();
                        case SEEKER_AT_POSITION -> seekerAtPlace(event
                                .as(Event.SeekerAtPositionEvent.class).place);
                        case SEEKER_MOVE -> onSeekerMove(event
                                .as(Event.SeekerMoveEvent.class));
                    }
                }
            }
        }
    }

    private void onSeekerMove(Event.SeekerMoveEvent event) {
        // Publish changes to the frontend
        this.events.publish(TOPIC_EVENTS,
                GameEvent.seekerMove(gameId, seeker, event.origin,
                        event.destination, event.distance, event.duration));
    }

    public void onGameEnd() {
        done = true;
        var duration = System.currentTimeMillis() - begin;
        // Send the "end" event to the seeker
        redis.list(Event.GameEndedEvent.class).lpush(SEEKER_KEY,
                new Event.GameEndedEvent(gameId));

        this.events.publish(TOPIC_EVENTS, GameEvent.gameOver(gameId, duration,
                seeker, hiders));
    }

    public void seekerAtPlace(String place) {
        for (Hider hider : hiders) {
            if (hider.getPosition().equals(place)) {
                this.events.publish(TOPIC_EVENTS,
                        GameEvent.hiderDiscovered(gameId, seeker, hider, place));
                hider.discovered();
            }
        }

        int notYetFound = notYetFound();
        if (notYetFound == 0) {
            onGameEnd();
        }
    }

    private int notYetFound() {
        int notYetFound = 0;
        for (Hider hider : hiders) {
            if (!hider.hasBeenDiscovered()) {
                notYetFound++;
            }
        }
        return notYetFound;
    }

    private void initTimesUp() {
        Thread.ofVirtual().start(() -> {
            try {
                Thread.sleep(maxGameDuration);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
            if (!done) {
                this.redis.list(Event.TimesUpEvent.class)
                        .lpush("hide-and-seek:game", new Event.TimesUpEvent(gameId));
            }
        });
    }

}
