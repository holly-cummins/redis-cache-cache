package org.acme.hideandseek;

import io.quarkus.redis.datasource.sortedset.ScoredValue;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
public class LeaderboardResource {

    private final LeaderboardService leaderboard;

    public LeaderboardResource(LeaderboardService leaderboard) {
        this.leaderboard = leaderboard;
    }
    @GetMapping("/leaderboard")
    public List<ScoredValue<Player>> get() {
        return this.leaderboard.getLeaderboard();
    }
}
