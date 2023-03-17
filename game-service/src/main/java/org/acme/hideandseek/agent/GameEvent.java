package org.acme.hideandseek.agent;


public class GameEvent {
    public final Kind kind;
    public final String gameId;
    public final String hider;
    public final String seeker;
    public final String place;
    public final boolean seekerWon;
    public final int duration;
    public final double distance;
    public final String destination;

    @SuppressWarnings("unused")
    public GameEvent() {
        this.kind = null;
        this.gameId = null;
        this.hider = null;
        this.place = null;
        this.seeker = null;
        this.seekerWon = false;
        this.destination = null;
        this.distance = -1;
        this.duration = -1;
    }

    public GameEvent(Kind kind, String gameId, String hiderName, String hidingPlace) {
        this.kind = kind;
        this.gameId = gameId;
        this.hider = hiderName;
        this.place = hidingPlace;
        this.seeker = null;
        this.seekerWon = false;
        this.destination = null;
        this.distance = -1;
        this.duration = -1;
    }

    public GameEvent(Kind kind, String gameId, String seeker) {
        this.kind = kind;
        this.gameId = gameId;
        this.seeker = seeker;
        this.place = null;
        this.hider = null;
        this.seekerWon = false;
        this.destination = null;
        this.distance = -1;
        this.duration = -1;
    }

    public GameEvent(Kind kind, String gameId, boolean seekerWon) {
        this.kind = kind;
        this.gameId = gameId;
        this.seeker = null;
        this.place = null;
        this.hider = null;
        this.seekerWon = seekerWon;
        this.destination = null;
        this.distance = -1;
        this.duration = -1;
    }

    public GameEvent(Kind kind, String gameId, String seeker, String hider, String place) {
        this.kind = kind;
        this.gameId = gameId;
        this.seeker = seeker;
        this.place = place;
        this.hider = hider;
        this.seekerWon = false;
        this.destination = null;
        this.distance = -1;
        this.duration = -1;
    }

    public GameEvent(Kind kind, String gameId, String seeker, String position, String destination, double distance, int duration) {
        this.kind = kind;
        this.gameId = gameId;
        this.seeker = seeker;
        this.place = position;
        this.destination = destination;
        this.distance = distance;
        this.duration = duration;
        this.hider = null;
        this.seekerWon = false;
    }

    enum Kind {
        HIDER,
        NEW_GAME,
        GAME_OVER,
        PLAYER_DISCOVERED,
        SEEKER_MOVE
    }
}
