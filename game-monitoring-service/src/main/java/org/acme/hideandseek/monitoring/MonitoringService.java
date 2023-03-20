package org.acme.hideandseek.monitoring;

import io.quarkus.redis.datasource.RedisDataSource;
import io.quarkus.redis.datasource.timeseries.AddArgs;
import io.quarkus.redis.datasource.timeseries.Aggregation;
import io.quarkus.redis.datasource.timeseries.CreateArgs;
import io.quarkus.redis.datasource.timeseries.RangeArgs;
import io.quarkus.redis.datasource.timeseries.TimeSeriesRange;
import io.smallrye.mutiny.Multi;
import io.smallrye.mutiny.operators.multi.processors.BroadcastProcessor;
import io.smallrye.mutiny.tuples.Tuple2;
import org.springframework.stereotype.Service;

import java.time.Duration;

@Service
public class MonitoringService {

    public static final String KEY = "game:monitoring";
    private final RedisDataSource redis;
    private final BroadcastProcessor<MonitoringData> stream;

    record MonitoringData(double average, double duration) {}

    public MonitoringService(RedisDataSource redis) {
        this.redis = redis;
        if (! this.redis.key().exists(KEY)) {
            this.redis.timeseries().tsCreate(KEY);
        }
        this.stream = BroadcastProcessor.create();
        this.redis.pubsub(GameCompletedEvent.class).subscribe("game:completed", this::handle);
    }

    private void handle(GameCompletedEvent event) {
        Thread.ofVirtual().start(() -> {
            redis.timeseries().tsAdd(KEY, System.currentTimeMillis(), event.duration,
                    new AddArgs().label("seeker-won", event.nonDiscoveredPlayers == 0));
            stream.onNext(new MonitoringData(getAverageForTheLastTwoMinutes(), getGameTimeForTheLastTwoMinutes()));
        });
    }


    public double getLast() {
        return redis.timeseries().tsGet(KEY).value;
    }

    public double getAverageForTheLastTwoMinutes() {
        var samples = redis.timeseries().tsRange(KEY,
                TimeSeriesRange.fromTimeSeries(),
                new RangeArgs().aggregation(Aggregation.AVG, Duration.ofMinutes(2)).latest());
        if (! samples.isEmpty()) {
            return samples.get(samples.size() -1).value;
        }
        return -1;
    }

    public double getGameTimeForTheLastTwoMinutes() {
        var samples = redis.timeseries().tsRange(KEY,
                TimeSeriesRange.fromTimeSeries(),
                new RangeArgs().aggregation(Aggregation.SUM, Duration.ofMinutes(2)).latest());
        if (! samples.isEmpty()) {
            return samples.get(samples.size() -1).value;
        }
        return -1;
    }

    public Multi<MonitoringData> stream() {
        return stream;
    }

}
