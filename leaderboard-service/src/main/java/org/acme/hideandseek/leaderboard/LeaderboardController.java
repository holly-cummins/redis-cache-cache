package org.acme.hideandseek.leaderboard;

import io.quarkus.redis.datasource.sortedset.ScoredValue;
import io.smallrye.mutiny.Multi;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
public class LeaderboardController {

    private final LeaderboardService leaderboard;

    public LeaderboardController(LeaderboardService leaderboard) {
        this.leaderboard = leaderboard;
    }

    @GetMapping("/leaderboard")
    public List<ScoredValue<String>> get() {
        return this.leaderboard.getLeaderboard();
    }

    @GetMapping("/leaderboard/stream")
    public Multi<List<ScoredValue<String>>> getStream() {
        return this.leaderboard.getLeaderboardStream();
    }
}
