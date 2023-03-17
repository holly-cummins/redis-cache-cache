package org.acme.hideandseek.agent;

import org.acme.hideandseek.Player;
import org.jboss.logging.Logger;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Random;

public class Hider {

    public final Player player;
    private final String position;
    private boolean found = false;

    private final static Logger LOGGER = Logger.getLogger("Hider");


    public Hider(Player player, List<String> places) {
        this.player = player;
        // Pick a random place.
        Random random = new Random();
        var idx = random.nextInt(places.size() -1);
        this.position = places.get(idx);
        LOGGER.infof("%s is hiding at %s", player.name(), position);
    }

    public synchronized void discovered() {
        found = true;
    }

    public synchronized boolean hasBeenDiscovered() {
        return found;
    }

    public String getPosition() {
        return position;
    }

}
