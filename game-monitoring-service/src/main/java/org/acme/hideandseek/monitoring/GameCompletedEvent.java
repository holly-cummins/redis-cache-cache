package org.acme.hideandseek.monitoring;

import java.util.List;

public class GameCompletedEvent {

    public String seeker;
    public List<String> hiders;
    public int nonDiscoveredPlayers;

    public long duration;
}
