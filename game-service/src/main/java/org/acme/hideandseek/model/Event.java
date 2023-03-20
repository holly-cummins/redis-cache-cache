package org.acme.hideandseek.model;

import static org.acme.hideandseek.model.Event.EventKind.GAME_ENDED;
import static org.acme.hideandseek.model.Event.EventKind.GAME_STARTED;
import static org.acme.hideandseek.model.Event.EventKind.SEEKER_AT_POSITION;

public class Event {

    public final EventKind kind;

    public final String place;

    private Event(EventKind kind, String place) {
        this.kind = kind;
        this.place = place;
    }

    public static Event seekerAtPosition(String destination) {
        return new Event(SEEKER_AT_POSITION, destination);
    }

    public static Event gameStarted(String startingPosition) {
        return new Event(GAME_STARTED, startingPosition);
    }

    public static Event gameEnded() {
        return new Event(GAME_ENDED, null);
    }

    public static Event seekerArrivedAt(String destination) {
        return new Event(EventKind.SEEKER_ARRIVED, destination);
    }

    public static Event timesUp() {
        return new Event(EventKind.TIMES_UP, null);
    }

    public enum EventKind {
        // Received by the seeker
        GAME_STARTED,
        GAME_ENDED,
        SEEKER_ARRIVED,

        // ----

        // Received by the game
        SEEKER_AT_POSITION,
        TIMES_UP

    }
}
