package org.acme.hideandseek.superseeker;

import io.quarkus.redis.datasource.RedisDataSource;
import io.quarkus.redis.datasource.geo.GeoSearchArgs;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

import static io.quarkus.redis.datasource.geo.GeoUnit.KM;

@Service
public class PlaceRepository {

    private final RedisDataSource redis;

    @ConfigProperty(name = "hide-and-seek.starting-point.radius", defaultValue = "50000")
    double startingPointRadius;

    @ConfigProperty(name = "hide-and-seek.starting-point.name", defaultValue = "Paris")
    String startingPointName;

    PlaceRepository(RedisDataSource redis) {
        this.redis = redis;
    }

    List<String> getPlaceNames() {
        var list = redis.geo(String.class).geosearch("hide-and-seek:geo",
                new GeoSearchArgs<String>().fromMember(startingPointName)
                        .byRadius(startingPointRadius, KM));
        return list.stream()
                .map(gv -> gv.member)
                .collect(Collectors.toList());
    }
}
