package org.acme.hideandseek.actors;

import io.quarkus.redis.datasource.RedisDataSource;
import io.quarkus.redis.datasource.pubsub.PubSubCommands;
import org.acme.hideandseek.model.Event;
import org.acme.hideandseek.model.GameCompletedEvent;
import org.acme.hideandseek.model.GameEvent;
import org.acme.hideandseek.model.Player;
import org.jboss.logging.Logger;

import java.time.Duration;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Random;
import java.util.UUID;
import java.util.stream.Collectors;

public class Game implements Runnable {

    private final static Logger LOGGER = Logger.getLogger("Game");
    private final static String SEEKER = "seeker";
    public final String gameId = UUID.randomUUID().toString();
    private final PubSubCommands<GameEvent> events;
    private final List<Hider> hiders = new ArrayList<>();
    private final PubSubCommands<GameCompletedEvent> completed;
    private final Player seeker;
    private final RedisDataSource redis;

    private volatile boolean done;
    private volatile long begin;

    public Game(Collection<Player> players, List<String> places, RedisDataSource redis) {
        // Redis objects
        // to read from the "game" queue and write to the "seeker" queue.
        this.redis = redis;

        // commands to broadcast events
        this.events = redis.pubsub(GameEvent.class);
        this.completed = redis.pubsub(GameCompletedEvent.class);

        LOGGER.infof("New game with %d players and %d places", players.size(), places.size());
        LOGGER.infof("Initializing game %s", gameId);

        List<Player> copy = new ArrayList<>(players);
        Random random = new Random();
        // Pick random seeker
        int index = random.nextInt(copy.size() - 1);
        this.seeker = copy.get(index);
        LOGGER.infof("The seeker is %s", this.seeker);
        // Others are going to hide
        copy.remove(this.seeker);
        for (Player player : copy) {
            Hider hider = new Hider(player, places);
            this.hiders.add(hider);
            this.events.publish("game-events", new GameEvent(GameEvent.Kind.HIDER, gameId, hider.player.name(), hider.getPosition()));
        }
        LOGGER.infof("%d hiders", this.hiders.size());
    }

    public void start() {
        Thread.ofVirtual().start(this);
    }

    public void run() {
        begin = System.currentTimeMillis();

        // Send game started event to the seeker
        this.redis.list(Event.GameStartedEvent.class).lpush(SEEKER, new Event.GameStartedEvent(gameId, seeker, "Devoxx"));
        this.events.publish("game-events", new GameEvent(GameEvent.Kind.NEW_GAME, gameId, seeker.name()));
        initTimesUp();

        while (!done) {
            // Read messages from the game queue
            var kv = redis.list(Event.class).blpop(Duration.ofSeconds(1), gameId);
            if (kv != null) {
                var event = kv.value;
                if (event.gameId.equals(gameId)) {
                    switch (event.kind) {
                        case TIMES_UP -> onGameEnd();
                        case SEEKER_AT_POSITION -> seekerAtPlace(event.as(Event.SeekerAtPositionEvent.class).place);
                        case SEEKER_MOVE -> onSeekerMove(event.as(Event.SeekerMoveEvent.class));
                    }
                }
            }
        }
    }

    private void onSeekerMove(Event.SeekerMoveEvent event) {
        this.events.publish("game-events", new GameEvent(GameEvent.Kind.SEEKER_MOVE, gameId, seeker.name(), event.origin, event.destination, event.distance, event.duration));
    }

    public void onGameEnd() {
        done = true;
        var duration = System.currentTimeMillis() - begin;
        // Send the "end" event to the seeker
        redis.list(Event.GameEndedEvent.class).lpush(SEEKER, new Event.GameEndedEvent(gameId));

        var notDiscovered = hiders.stream().filter(hider -> !hider.hasBeenDiscovered()).toList();

        // Communication with the leaderboard
        GameCompletedEvent event = new GameCompletedEvent();
        event.nonDiscoveredPlayers = notDiscovered.size();
        event.hiders = hiders.stream().map(h -> h.player.name()).collect(Collectors.toList());
        event.seeker = seeker.name();
        event.duration = duration;
        // Broadcast
        this.completed.publish("game:completed", event);

        // Communication with the UI
        if (notDiscovered.isEmpty()) {
            LOGGER.info("The seeker has won!");
            this.events.publish("game-events", new GameEvent(GameEvent.Kind.GAME_OVER, gameId, true));
        } else {
            LOGGER.infof("The seeker didn't find everyone, %d players not discovered", notDiscovered.size());
            this.events.publish("game-events", new GameEvent(GameEvent.Kind.GAME_OVER, gameId, false));
        }
    }

    public void seekerAtPlace(String place) {
        for (Hider hider : hiders) {
            if (hider.getPosition().equals(place)) {
                LOGGER.infof("%s (seeker) discovered %s at %s", seeker.name(), hider.player.name(), place);
                this.events.publish("game-events", new GameEvent(GameEvent.Kind.PLAYER_DISCOVERED, gameId, seeker.name(), hider.player.name(), place));
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
                Thread.sleep(10000); // TODO Config
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
            if (!done) {
                this.redis.list(Event.TimesUpEvent.class).lpush(gameId, new Event.TimesUpEvent(gameId));
            }
        });
    }

}
