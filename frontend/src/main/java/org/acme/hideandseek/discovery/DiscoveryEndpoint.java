package org.acme.hideandseek.discovery;

import io.smallrye.mutiny.Uni;
import io.smallrye.stork.Stork;
import io.smallrye.stork.api.Service;
import io.smallrye.stork.api.ServiceInstance;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;

import java.util.List;
import java.util.Map;

@Path("/discovery")
public class DiscoveryEndpoint {

    @GET
    public Uni<Map<String, String>> getServiceLocations() {
        Service game = Stork.getInstance().getService("game-service");
        Service leaderboard = Stork.getInstance().getService("leaderboard-service");
        Service place = Stork.getInstance().getService("place-service");

        Uni<String> hostForGame = game.getInstances()
                .map(DiscoveryEndpoint::getFirstOrNull);

        Uni<String> hostForLeaderboard = leaderboard.getInstances()
                .map(DiscoveryEndpoint::getFirstOrNull);

        Uni<String> hostForPlace = place.getInstances()
                .map(DiscoveryEndpoint::getFirstOrNull);

        return Uni.join().all(hostForGame, hostForLeaderboard, hostForPlace).andFailFast()
                .map(urls -> Map.of(
                        "game", urls.get(0),
                        "leaderboard", urls.get(1),
                        "place", urls.get(2))
                );

    }

    private static String getFirstOrNull(List<ServiceInstance> list) {
        if (list.isEmpty()) {
            return null;
        }
        ServiceInstance instance = list.get(0);
        String scheme = "http";
        if (instance.isSecure()) {
            scheme += "s";
        }
        return scheme + "://" + instance.getHost() + ":" + instance.getPort();
    }
}
