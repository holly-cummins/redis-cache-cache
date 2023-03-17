package org.acme.hideandseek.agent;

import io.quarkus.redis.datasource.RedisDataSource;
import io.quarkus.redis.datasource.list.ListCommands;
import io.quarkus.redis.datasource.pubsub.PubSubCommands;
import io.quarkus.redis.datasource.sortedset.SortedSetCommands;
import org.acme.hideandseek.Player;
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
    public final String id = UUID.randomUUID().toString();
    private final List<Player> players;
    private final SortedSetCommands<String, Player> leaderboard;
    private final ListCommands<String, Event> queues;
    private final PubSubCommands<GameEvent> events;
    private final Seeker seeker;
    private final List<Hider> hiders = new ArrayList<>();

    private volatile boolean done;

    public Game(Collection<Player> players, List<String> places, RedisDataSource redis) {
        // Redis objects
        // to read from the "game" queue and write to the "seeker" queue.
        this.queues = redis.list(Event.class);
        // to keep track of the score
        this.leaderboard = redis.sortedSet(Player.class);
        // commands to broadcast events
        this.events = redis.pubsub(GameEvent.class);

        LOGGER.infof("New game with %d players and %d places", players.size(), places.size());
        LOGGER.infof("Initializing game %s", id);

        this.players = new ArrayList<>(players);
        Random random = new Random();
        // Pick random seeker
        int index = random.nextInt(this.players.size() - 1);
        this.seeker = new Seeker(this.players.get(index), id, places, redis);
        LOGGER.infof("The seeker is %s", this.seeker.player.name());
        // Others are going to hide
        var copy = new ArrayList<>(players);
        copy.remove(this.seeker.player);
        for (Player player : copy) {
            Hider hider = new Hider(player, places);
            this.hiders.add(hider);
            this.events.publish("game-events", new GameEvent(GameEvent.Kind.HIDER, id, hider.player.name(), hider.getPosition()));
        }
        LOGGER.infof("%d hiders", this.hiders.size());
    }

    public void start() {
        Thread.ofVirtual().start(this);
    }

    public void run() {
        seeker.start();

        // Send game started event to the seeker
        this.queues.lpush(seeker.inbox, Event.gameStarted(getStartingPoint()));
        this.events.publish("game-events", new GameEvent(GameEvent.Kind.NEW_GAME, id, seeker.player.name()));
        initTimesUp();

        while (!done) {
            // Read messages from the game queue
            var kv = queues.blpop(Duration.ofSeconds(1), id);
            if (kv != null) {
                var event = kv.value;
                switch (event.kind) {
                    case TIMES_UP -> onGameEnd();
                    case SEEKER_AT_POSITION -> seekerAtPlace(event.place);
                }
            }
        }
    }

    public void onGameEnd() {
        done = true;
        // Send the "end" event to the seeker
        queues.lpush(seeker.inbox, Event.gameEnded());

        // Compute the score
        var notDiscovered = hiders.stream().filter(hider -> !hider.hasBeenDiscovered()).collect(Collectors.toList());
        if (notDiscovered.isEmpty()) {
            LOGGER.info("The seeker has won!");
            this.events.publish("game-events", new GameEvent(GameEvent.Kind.GAME_OVER, id, true));
        } else {
            LOGGER.infof("The seeker didn't find everyone, %d players not discovered", notDiscovered.size());
            this.events.publish("game-events", new GameEvent(GameEvent.Kind.GAME_OVER, id, false));
        }

        updateScores(notDiscovered);
    }

    private void updateScores(List<Hider> hidersNotDiscovered) {
        // seeker = number of found players -1 (the seeker)
        leaderboard.zincrby("leaderboard", players.size() - hidersNotDiscovered.size() -1, seeker.player);
        // not discovered players: + 1
        for (Hider hider : hidersNotDiscovered) {
            leaderboard.zincrby("leaderboard", 1, hider.player);
        }
    }

    public String getStartingPoint() {
        return "Devoxx"; // TODO Configuration?
    }

    public void seekerAtPlace(String place) {
        for (Hider hider : hiders) {
            if (hider.getPosition().equals(place)) {
                LOGGER.infof("%s (seeker) discovered %s at %s", seeker.player.name(), hider.player.name(), place);
                this.events.publish("game-events", new GameEvent(GameEvent.Kind.PLAYER_DISCOVERED, id, seeker.player.name(), hider.player.name(), place));
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
                queues.lpush(id, Event.timesUp());
            }
        });
    }

}
