package org.acme.hideandseek.model;


import com.fasterxml.jackson.annotation.JsonInclude;

import java.util.Optional;
import java.util.OptionalDouble;
import java.util.OptionalInt;

public class GameEvent {
    public final Kind kind;
    public final String gameId;
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public final String hider;
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public final String seeker;
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public final String place;
    @JsonInclude(JsonInclude.Include.NON_ABSENT)
    public final Optional<Boolean> seekerWon;
    @JsonInclude(JsonInclude.Include.NON_ABSENT)
    public final OptionalInt duration;
    @JsonInclude(JsonInclude.Include.NON_ABSENT)
    public final OptionalDouble distance;
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public final String destination;

    @SuppressWarnings("unused")
    public GameEvent() {
        this.kind = null;
        this.gameId = null;
        this.hider = null;
        this.place = null;
        this.seeker = null;
        this.seekerWon = Optional.empty();
        this.destination = null;
        this.distance = OptionalDouble.empty();
        this.duration = OptionalInt.empty();
    }

    public GameEvent(Kind kind, String gameId, String hiderName, String hidingPlace) {
        this.kind = kind;
        this.gameId = gameId;
        this.hider = hiderName;
        this.place = hidingPlace;
        this.seeker = null;
        this.seekerWon = Optional.empty();
        this.destination = null;
        this.distance = OptionalDouble.empty();
        this.duration = OptionalInt.empty();
    }

    public GameEvent(Kind kind, String gameId, String seeker) {
        this.kind = kind;
        this.gameId = gameId;
        this.seeker = seeker;
        this.place = null;
        this.hider = null;
        this.seekerWon = Optional.empty();
        this.destination = null;
        this.distance = OptionalDouble.empty();
        this.duration = OptionalInt.empty();
    }

    public GameEvent(Kind kind, String gameId, boolean seekerWon) {
        this.kind = kind;
        this.gameId = gameId;
        this.seeker = null;
        this.place = null;
        this.hider = null;
        this.seekerWon = Optional.of(seekerWon);
        this.destination = null;
        this.distance = OptionalDouble.empty();
        this.duration = OptionalInt.empty();
    }

    public GameEvent(Kind kind, String gameId, String seeker, String hider, String place) {
        this.kind = kind;
        this.gameId = gameId;
        this.seeker = seeker;
        this.place = place;
        this.hider = hider;
        this.seekerWon = Optional.empty();
        this.destination = null;
        this.distance = OptionalDouble.empty();
        this.duration = OptionalInt.empty();
    }

    public GameEvent(Kind kind, String gameId, String seeker, String position, String destination, double distance, int duration) {
        this.kind = kind;
        this.gameId = gameId;
        this.seeker = seeker;
        this.place = position;
        this.destination = destination;
        this.seekerWon = Optional.empty();
        this.distance = OptionalDouble.of(distance);
        this.duration = OptionalInt.of(duration);
        this.hider = null;
    }

    public enum Kind {
        HIDER,
        NEW_GAME,
        GAME_OVER,
        PLAYER_DISCOVERED,
        SEEKER_MOVE
    }
}
