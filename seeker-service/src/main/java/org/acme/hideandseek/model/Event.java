package org.acme.hideandseek.model;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonTypeInfo;

@JsonIgnoreProperties(ignoreUnknown = true)
@JsonTypeInfo(use = JsonTypeInfo.Id.CLASS)
@JsonSubTypes({
        @JsonSubTypes.Type(value = Event.GameStartedEvent.class, name = "GameStartedEvent"),
        @JsonSubTypes.Type(value = Event.GameEndedEvent.class, name = "GameEndedEvent"),
        @JsonSubTypes.Type(value = Event.TimesUpEvent.class, name = "TimesUpEvent"),
        @JsonSubTypes.Type(value = Event.SeekerMoveEvent.class, name = "SeekerMoveEvent"),
        @JsonSubTypes.Type(value = Event.SeekerAtPositionEvent.class, name = "SeekerAtPositionEvent"),
        @JsonSubTypes.Type(value = Event.SeekerArrivedAtEvent.class, name = "SeekerArrivedAtEvent")
}
)
public class Event {

    public final Kind kind;
    public final String gameId;

    @JsonCreator
    public Event(Kind kind, String gameId) {
        this.kind = kind;
        this.gameId = gameId;
    }


    public <T extends Event> T as(Class<T> clazz) {
        return clazz.cast(this);
    }

    public static class GameStartedEvent extends Event {

        public final Player seeker;

        @JsonCreator
        public GameStartedEvent(String gameId, Player seeker) {
            super(Kind.GAME_STARTED, gameId);
            this.seeker = seeker;
        }
    }

    public static class GameEndedEvent extends Event {

        @JsonCreator
        public GameEndedEvent(String gameId) {
            super(Kind.GAME_ENDED, gameId);
        }
    }

    public static class TimesUpEvent extends Event {
        @JsonCreator
        public TimesUpEvent(String gameId) {
            super(Kind.TIMES_UP, gameId);
        }
    }

    public static class SeekerMoveEvent extends Event {
        public final String origin;
        public final String destination;
        public final long duration;
        public final double distance;

        @JsonCreator
        public SeekerMoveEvent(String gameId, String origin, String destination, long duration, double distance) {
            super(Kind.SEEKER_MOVE, gameId);
            this.origin = origin;
            this.destination = destination;
            this.duration = duration;
            this.distance = distance;
        }
    }

    public static class SeekerAtPositionEvent extends Event {

        public final String place;
        @JsonCreator
        public SeekerAtPositionEvent(String gameId, String place) {
            super(Kind.SEEKER_AT_POSITION, gameId);
            this.place = place;
        }
    }

    public static class SeekerArrivedAtEvent extends Event {

        public final String place;
        @JsonCreator
        public SeekerArrivedAtEvent(String gameId, String place) {
            super(Kind.SEEKER_ARRIVED, gameId);
            this.place = place;
        }
    }

    public enum Kind {
        // Received by the seeker
        GAME_STARTED,
        GAME_ENDED,
        SEEKER_ARRIVED,

        // ----

        // Received by the game
        SEEKER_AT_POSITION,
        TIMES_UP,

        SEEKER_MOVE,

    }
}


