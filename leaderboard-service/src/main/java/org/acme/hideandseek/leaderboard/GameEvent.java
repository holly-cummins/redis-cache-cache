package org.acme.hideandseek.leaderboard;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.util.Map;
import java.util.Optional;
import java.util.OptionalDouble;
import java.util.OptionalInt;
import java.util.OptionalLong;

public class GameEvent {
    public Kind kind;
    public String gameId;
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public String seeker;

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public String hider;
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public String place;
    @JsonInclude(JsonInclude.Include.NON_ABSENT)
    public Optional<Boolean> seekerWon;
    @JsonInclude(JsonInclude.Include.NON_ABSENT)
    public OptionalLong duration;
    @JsonInclude(JsonInclude.Include.NON_ABSENT)
    public OptionalDouble distance;
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public String destination;

    @JsonInclude(JsonInclude.Include.NON_ABSENT)
    public OptionalInt nonDiscoveredPlayers;

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public Map<String, String> hiders;

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

    public enum Kind {
        NEW_GAME,
        GAME_OVER,
        PLAYER_DISCOVERED,
        SEEKER_MOVE
    }
}
