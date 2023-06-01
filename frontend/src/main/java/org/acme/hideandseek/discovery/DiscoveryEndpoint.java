package org.acme.hideandseek.discovery;

import jakarta.inject.Inject;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import org.jboss.resteasy.reactive.RestQuery;

import java.util.Arrays;
import java.util.HashMap;
import java.util.Map;

@Path("/discovery")
public class DiscoveryEndpoint {

    @Inject OpenshiftLookup lookup;

    enum Services {
        GAME("game", "http://localhost:8091", "hide-and-seek-game-service"),
        PLACE("place", "http://localhost:8092", "hide-and-seek-place-service"),
        LEADERBOARD("leaderboard", "http://localhost:8093", "hide-and-seek-leaderboard-service");

        private final String local;
        private final String remote;
        private final String name;

        Services(String serviceName, String local, String remote) {
            this.name = serviceName;
            this.local = local;
            this.remote = remote;
        }
    }

    @GET
    public Map<String, String> getServiceLocations(@RestQuery("current") String currentLocation) {
        if (lookup.isOpenShift(currentLocation)) {
            // Prod mode
            return Arrays.stream(Services.values()).collect(HashMap::new, (map, service) -> map.put(service.name, lookup.resolve(service.remote)), HashMap::putAll);
        } else {
            // Local mode.
            return Arrays.stream(Services.values()).collect(HashMap::new, (map, service) -> map.put(service.name, service.local), HashMap::putAll);
        }

    }

}
