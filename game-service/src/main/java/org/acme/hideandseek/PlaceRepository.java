package org.acme.hideandseek;

import io.quarkus.redis.datasource.RedisDataSource;
import io.quarkus.redis.datasource.geo.GeoSearchArgs;
import org.acme.hideandseek.model.Place;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

import static io.quarkus.redis.datasource.geo.GeoUnit.KM;

@Service
public class PlaceRepository {

    private final RedisDataSource redis;

    @ConfigProperty(name = "hide-and-seek.starting-point.radius")
    double startingPointRadius;

    @ConfigProperty(name = "hide-and-seek.starting-point.name")
    String startingPointName;

    PlaceRepository(RedisDataSource redis) {
        this.redis = redis;
    }

    List<Place> getPlaces() {
        var list = redis.geo(String.class).geosearch("places_geo",
                new GeoSearchArgs<String>().fromMember(startingPointName)
                        .byRadius(startingPointRadius, KM)
                        .withDistance()
                        .withCoordinates());
        return list.stream()
                .map(gv -> new Place(gv.member, gv.longitude.orElseThrow(), gv.latitude.orElseThrow()))
                .collect(Collectors.toList());
    }

    List<String> getPlaceNames() {
        return getPlaces().stream().map(Place::name).collect(Collectors.toList());
    }

}
