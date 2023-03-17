package org.acme.hideandseek;

import io.quarkus.redis.datasource.geo.GeoValue;

public record Place(String name, String picture, double longitude, double latitude) {

    public Place with(GeoValue<String> gv) {
        return new Place(name, picture, gv.longitude.orElseThrow(), gv.latitude.orElseThrow());
    }
}
