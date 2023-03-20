package org.acme.hideandseek.leaderboard;

import io.quarkus.redis.datasource.RedisDataSource;
import io.quarkus.redis.datasource.sortedset.ScoredValue;
import io.quarkus.redis.datasource.sortedset.ZRangeArgs;
import io.smallrye.mutiny.Multi;
import io.smallrye.mutiny.operators.multi.processors.BroadcastProcessor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class LeaderboardService {

    private static final String KEY = "leaderboard";
    private final RedisDataSource redis;

    public LeaderboardService(RedisDataSource redis) {
        this.redis = redis;
        this.redis.pubsub(GameCompletedEvent.class)
                .subscribe("game:completed", this::updateScore);
    }

    private void updateScore(GameCompletedEvent event) {
        // seeker = number of found players -1 (the seeker)
        increment(event.seeker, event.hiders.size() - event.nonDiscoveredPlayers);
        // not discovered players: + 1
        for (String hider : event.hiders) {
            increment(hider, 1);
        }
        stream.onNext(getLeaderboard());
    }

    private void increment(String player, int score) {
        redis.sortedSet(String.class).zincrby(KEY, score, player);
    }

    public List<ScoredValue<String>> getLeaderboard() {
        return redis.sortedSet(String.class).zrangeWithScores(KEY, 0, -1, new ZRangeArgs().rev());
    }

    private BroadcastProcessor<List<ScoredValue<String>>> stream = BroadcastProcessor.create();

    public Multi<List<ScoredValue<String>>> getLeaderboardStream() {
        return stream;
    }
}
