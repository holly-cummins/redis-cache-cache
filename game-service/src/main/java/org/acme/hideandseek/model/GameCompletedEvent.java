package org.acme.hideandseek.model;

import java.util.List;

public class GameCompletedEvent {

    public String seeker;
    public List<String> hiders;
    public int nonDiscoveredPlayers;
}