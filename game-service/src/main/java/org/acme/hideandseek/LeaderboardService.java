package org.acme.hideandseek;

import io.quarkus.redis.datasource.RedisDataSource;
import io.quarkus.redis.datasource.sortedset.ScoredValue;
import io.quarkus.redis.datasource.sortedset.SortedSetCommands;
import io.quarkus.redis.datasource.sortedset.ZRangeArgs;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class LeaderboardService {

    private final String KEY = "leaderboard";

    private final SortedSetCommands<String, Player> leaderboard;

    public LeaderboardService(RedisDataSource redis) {
        leaderboard = redis.sortedSet(Player.class);
    }

    public void increment(Player player, int score) {
        leaderboard.zincrby(KEY, score, player);
    }

    public List<ScoredValue<Player>> getLeaderboard() {
        return leaderboard.zrangeWithScores(KEY, 0, -1, new ZRangeArgs().rev());
    }
}
