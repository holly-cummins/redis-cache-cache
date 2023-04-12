package org.acme.hideandseek;

import io.quarkus.redis.datasource.RedisDataSource;
import io.quarkus.redis.datasource.hash.HashCommands;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public class PlayerRepository {

    private static final String PLAYER_KEY = "hide-and-seek:players";
    private final RedisDataSource redis;
    private final HashCommands<String, String, Player> hash;
    private final IdGenerator generator;

    public PlayerRepository(RedisDataSource redis, IdGenerator generator) {
        this.generator = generator;
        this.redis = redis;
        this.hash = redis.hash(Player.class);
    }

    List<Player> getAll() {
        // Get all values from the hash
        return hash.hvals(PLAYER_KEY);
    }

    Player getOne(String id) {
        return hash.hget(PLAYER_KEY, id);
    }

    boolean delete(String id) {
        return hash.hdel(PLAYER_KEY, id) == 1;
    }

    Player create(Player player) {
        if (player.id() != null) {
            return null;
        }
        var id = generator.generate();
        var persisted = player.withId(id);
        // Add a field/value to the hash
        hash.hset(PLAYER_KEY, id, persisted);
        return persisted;
    }

    boolean update(String id, Player player) {
        // Check-And-Set pattern
        return !redis.withTransaction(
                // Before the transaction, get the existing player
                con -> con.hash(Player.class).hget(PLAYER_KEY, id),
                // In the transaction, update the player if it exists
                (found, tx) -> {
                    if (found == null) {
                        tx.discard();
                    } else {
                        var copy = new Player(id, player.name(), player.speed());
                        tx.hash(Player.class).hset(PLAYER_KEY, id, copy);
                    }
                },
                PLAYER_KEY) // Watch the key, so any write would discard the transaction
        .discarded();
    }
}
