package org.acme.hideandseek.monitoring;

import io.smallrye.common.annotation.Blocking;
import io.smallrye.mutiny.Multi;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;

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
        return monitoring.stream();
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
