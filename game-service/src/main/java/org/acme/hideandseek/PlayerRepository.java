package org.acme.hideandseek;

import io.quarkus.redis.datasource.RedisDataSource;
import io.quarkus.redis.datasource.hash.HashCommands;
import org.acme.hideandseek.model.Player;
import org.springframework.stereotype.Service;

import java.util.Collection;

@Service
public class PlayerRepository {


    private final HashCommands<String, String, Player> players;

    PlayerRepository(RedisDataSource ds) {
        players = ds.hash(Player.class);
    }

    public Collection<Player> getAllPlayers() {
        return players.hgetall("players").values();
    }

}
