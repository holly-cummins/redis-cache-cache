package org.acme.hideandseek.leaderboard;

import io.quarkus.redis.datasource.sortedset.ScoredValue;
import io.smallrye.common.annotation.Blocking;
import io.smallrye.mutiny.Multi;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;

import java.time.Duration;
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

    @GetMapping("/leaderboard/events")
    @Produces(MediaType.SERVER_SENT_EVENTS)
    @Blocking
    public Multi<List<ScoredValue<String>>> getStream() {
        return Multi.createBy().merging().streams(this.leaderboard.getLeaderboardStream(),
                Multi.createFrom().ticks().every(Duration.ofSeconds(10))
                        .map(x -> List.of())
        );
    }
}
