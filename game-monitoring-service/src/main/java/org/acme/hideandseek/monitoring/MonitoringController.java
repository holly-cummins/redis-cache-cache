package org.acme.hideandseek.monitoring;

import io.smallrye.common.annotation.Blocking;
import io.smallrye.mutiny.Multi;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;

import java.time.Duration;

@RestController
public class MonitoringController {

    private final MonitoringService monitoring;

    public MonitoringController(MonitoringService monitoring) {
        this.monitoring = monitoring;
    }

    @GetMapping("/monitoring")
    @Produces(MediaType.SERVER_SENT_EVENTS)
    @Blocking
    public Multi<MonitoringService.MonitoringData> stream() {
        return Multi.createBy().merging().streams(monitoring.stream(),
                Multi.createFrom().ticks().every(Duration.ofSeconds(10))
                        .map(x -> MonitoringService.EMPTY)
        );
    }

    @GetMapping("/monitoring/last")
    public double getLast() {
        return monitoring.getLast();
    }

    @GetMapping("/monitoring/average")
    public double getAverage() {
        return monitoring.getAverageForTheLastTwoMinutes();
    }

    @GetMapping("/monitoring/duration")
    public double getGameTime() {
        return monitoring.getGameTimeForTheLastTwoMinutes();
    }
}
