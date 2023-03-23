package org.acme.hideandseek.places;

import io.quarkus.redis.datasource.RedisDataSource;
import io.quarkus.redis.datasource.search.Document;
import io.quarkus.runtime.Startup;

import java.util.List;
import java.util.stream.Collectors;

@Startup
public class PlaceRepository {

    private final RedisDataSource redis;

    PlaceRepository(RedisDataSource redis) {
        this.redis = redis;
        initGeoSpatialData();
    }

    private void initGeoSpatialData() {
        for (String key : redis.key().keys("hide-and-seek:places:*")) {
            Place place = redis.json().jsonGet(key, Place.class);
            String[] pos = place.coordinates().split(",");
            redis.geo(String.class).geoadd("hide-and-seek:geo", Double.parseDouble(pos[0]), Double.parseDouble(pos[1]), place.name());
        }
    }

    List<Place> getPlaces() {
        return redis.key().keys("hide-and-seek:places:*").stream()
                .map(key -> redis.json().jsonGet(key, Place.class))
                .collect(Collectors.toList());
    }

    List<Place> search(String query) {
        return redis.search().ftSearch("hide-and-seek:places-index", query)
                .documents()
                .stream()
                .map(this::createPlaceFromDocument)
                .collect(Collectors.toList());

    }

    private Place createPlaceFromDocument(Document document) {
        return document.properties().get("$")
            .asJsonObject().mapTo(Place.class);
    }

}
