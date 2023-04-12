package org.acme.hideandseek.leaderboard;

import io.quarkus.redis.datasource.RedisDataSource;
import io.quarkus.redis.datasource.sortedset.ScoredValue;
import io.quarkus.redis.datasource.sortedset.ZRangeArgs;
import io.quarkus.runtime.Startup;
import io.smallrye.mutiny.Multi;
import io.smallrye.mutiny.operators.multi.processors.BroadcastProcessor;

import java.util.List;

@Startup
public class LeaderboardService {

    public static final String TOPIC_EVENTS = "hide-and-seek/events";

    public static final String KEY = "leaderboard";
    private final RedisDataSource redis;

    public LeaderboardService(RedisDataSource redis) {
        this.redis = redis;
        // Receive events
        this.redis.pubsub(GameEvent.class)
                .subscribe(TOPIC_EVENTS, event -> {
                    if (event.kind == GameEvent.Kind.GAME_OVER) {
                        Thread.ofVirtual().start(() -> updateScore(event));
                    }
                });
    }

    private void increment(String player, int score) {
        // Use a sorted list to store the scores
        redis.sortedSet(String.class).zincrby(KEY, score, player);
    }

    private synchronized void updateScore(GameEvent event) {
        // seeker = number of found players -1 (the seeker)
        increment(event.seeker, event.hiders.keySet().size() - event.nonDiscoveredPlayers.orElse(0));
        stream.onNext(getLeaderboard());
    }

    public List<ScoredValue<String>> getLeaderboard() {
        // Get the sorted set (reverse order)
        return redis.sortedSet(String.class)
                .zrangeWithScores(KEY, 0, -1, new ZRangeArgs().rev());
    }

    private final BroadcastProcessor<List<ScoredValue<String>>> stream = BroadcastProcessor.create();

    public Multi<List<ScoredValue<String>>> getLeaderboardStream() {
        return stream;
    }
}
