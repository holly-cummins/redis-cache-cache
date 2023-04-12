package org.acme.hideandseek.monitoring;

import io.quarkus.redis.datasource.RedisDataSource;
import io.quarkus.redis.datasource.timeseries.AddArgs;
import io.quarkus.redis.datasource.timeseries.Aggregation;
import io.quarkus.redis.datasource.timeseries.RangeArgs;
import io.quarkus.redis.datasource.timeseries.TimeSeriesRange;
import io.quarkus.runtime.Startup;
import io.smallrye.mutiny.Multi;
import io.smallrye.mutiny.operators.multi.processors.BroadcastProcessor;

import java.time.Duration;

@Startup
public class MonitoringService {

    public static final String TOPIC_EVENTS = "hide-and-seek/events";
    public static final String KEY = "hide-and-seek:game:monitoring";
    private final RedisDataSource redis;
    private final BroadcastProcessor<MonitoringData> stream;

    record MonitoringData(double average, double duration) {}

    public MonitoringService(RedisDataSource redis) {
        this.redis = redis;
        if (! this.redis.key().exists(KEY)) {
            this.redis.timeseries().tsCreate(KEY);
        }
        this.stream = BroadcastProcessor.create();
        this.redis.pubsub(GameEvent.class).subscribe(TOPIC_EVENTS, this::handle);
    }

    private void handle(GameEvent event) {
        if (event.kind == GameEvent.Kind.GAME_OVER) {
            Thread.ofVirtual().start(() -> {
                // Add the duration to the time series
                redis.timeseries().tsAdd(KEY, event.duration.orElse(0),
                        new AddArgs().label("seeker-won",
                                event.nonDiscoveredPlayers.orElse(0) == 0));

                stream.onNext(new MonitoringData(getAverageForTheLastTwoMinutes(),
                        getGameTimeForTheLastTwoMinutes()));
            });
        }
        // Otherwise ignore the event
    }


    public double getLast() {
        return redis.timeseries().tsGet(KEY).value;
    }

    public double getAverageForTheLastTwoMinutes() {
        // Retrieve the average duration for the last 2 minutes
        var samples = redis.timeseries().tsRange(KEY,
                TimeSeriesRange.fromTimeSeries(),
                new RangeArgs().aggregation(Aggregation.AVG,
                        Duration.ofMinutes(2)).latest());
        if (! samples.isEmpty()) {
            return samples.get(samples.size() -1).value;
        }
        return -1;
    }

    public double getGameTimeForTheLastTwoMinutes() {
        var samples = redis.timeseries().tsRange(KEY,
                TimeSeriesRange.fromTimeSeries(),
                new RangeArgs().aggregation(Aggregation.SUM,
                        Duration.ofMinutes(2)).latest());
        if (! samples.isEmpty()) {
            return samples.get(samples.size() -1).value;
        }
        return -1;
    }

    public Multi<MonitoringData> stream() {
        return stream;
    }

}
