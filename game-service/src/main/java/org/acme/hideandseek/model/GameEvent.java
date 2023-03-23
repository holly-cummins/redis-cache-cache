package org.acme.hideandseek.model;


import com.fasterxml.jackson.annotation.JsonInclude;
import org.acme.hideandseek.actors.Hider;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.OptionalDouble;
import java.util.OptionalInt;
import java.util.OptionalLong;

import static org.acme.hideandseek.model.GameEvent.Kind.PLAYER_DISCOVERED;
import static org.acme.hideandseek.model.GameEvent.Kind.SEEKER_MOVE;

public class GameEvent {
    public final Kind kind;
    public final String gameId;
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public final String seeker;

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public final String hider;
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public final String place;
    @JsonInclude(JsonInclude.Include.NON_ABSENT)
    public final Optional<Boolean> seekerWon;
    @JsonInclude(JsonInclude.Include.NON_ABSENT)
    public final OptionalLong duration;
    @JsonInclude(JsonInclude.Include.NON_ABSENT)
    public final OptionalDouble distance;
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public final String destination;

    @JsonInclude(JsonInclude.Include.NON_ABSENT)
    public final OptionalInt nonDiscoveredPlayers;

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public final Map<String, String> hiders;

    public GameEvent() {
        this.kind = null;
        this.gameId = null;
        this.place = null;
        this.seeker = null;
        this.hider = null;
        this.destination = null;
        this.distance = OptionalDouble.empty();
        this.hiders = null;
        this.nonDiscoveredPlayers = OptionalInt.empty();
        this.duration = OptionalLong.empty();
        this.seekerWon = Optional.empty();
    }

    private GameEvent(Kind kind, String gameId, String seeker, String hider, Map<String, String> hiders, String place, String destination, double distance, long duration, int nonDiscoveredPlayers) {
        this.kind = kind;
        this.gameId = gameId;
        this.seeker = seeker;
        this.hider = hider;
        this.hiders = hiders;
        this.place = place;
        this.destination = destination;
        if (distance > 0) {
            this.distance = OptionalDouble.of(distance);
        } else {
            this.distance = OptionalDouble.empty();
        }
        if (duration > 0) {
            this.duration = OptionalLong.of(duration);
        } else {
            this.duration = OptionalLong.empty();
        }
        if (nonDiscoveredPlayers != -1) {
            this.nonDiscoveredPlayers = OptionalInt.of(nonDiscoveredPlayers);
            this.seekerWon = Optional.of(nonDiscoveredPlayers == 0);
        } else {
            this.nonDiscoveredPlayers = OptionalInt.empty();
            this.seekerWon = Optional.empty();
        }
    }

    public static GameEvent newGame(String gameId, Player seeker, List<Hider> hiders) {
        Map<String, String> h = new HashMap<>();
        hiders.forEach(hider -> h.put(hider.player.name(), hider.getPosition()));
        return new GameEvent(GameEvent.Kind.NEW_GAME, gameId,
                seeker.name(), null,
                h, null, null, 0.0, 0, -1);
    }

    public static GameEvent gameOver(String gameId, long duration, Player seeker, List<Hider> hiders) {
        Map<String, String> h = new HashMap<>();
        hiders.forEach(hider -> h.put(hider.player.name(), hider.getPosition()));
        int sum = hiders.stream().mapToInt(hider -> hider.hasBeenDiscovered() ? 0 : 1).sum();
        return new GameEvent(Kind.GAME_OVER, gameId,
                seeker.name(), null, h, null, null, 0.0, duration, sum);
    }

    public static GameEvent hiderDiscovered(String gameId, Player seeker, Hider hider, String place) {
        return new GameEvent(PLAYER_DISCOVERED, gameId,
                seeker.name(), hider.player.name(), null, place, null, 0.0, 0, -1);
    }

    public static GameEvent seekerMove(String gameId, Player seeker, String place, String destination, double distance, long duration) {
        return new GameEvent(SEEKER_MOVE, gameId,
                seeker.name(), null, null, place, destination, distance, duration, -1);
    }

    public enum Kind {
        NEW_GAME,
        GAME_OVER,
        PLAYER_DISCOVERED,
        SEEKER_MOVE
    }
}
