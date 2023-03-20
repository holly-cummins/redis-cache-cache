package org.acme.hideandseek;

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

    @ConfigProperty(name = "hide-and-seek.starting-point.longitude")
    double startingPointLongitude;

    @ConfigProperty(name = "hide-and-seek.starting-point.latitude")
    double startingPointLatitude;

    @ConfigProperty(name = "hide-and-seek.starting-point.radius")
    double startingPointRadius;

    PlaceRepository(RedisDataSource redis) {
        this.redis = redis;
    }

    List<Place> getPlaces() {
        var list = redis.geo(String.class).geosearch("places_geo",
                new GeoSearchArgs<String>().fromCoordinate(startingPointLongitude, startingPointLatitude)
                        .byRadius(startingPointRadius, KM)
                        .withDistance()
                        .withCoordinates());
        var places = redis.hash(Place.class).hgetall("places");
        return list.stream()
                .map(gv -> places.get(gv.member).with(gv))
                .collect(Collectors.toList());
    }

    List<String> getPlaceNames() {
        return redis.hash(Place.class).hkeys("places");
    }

}
