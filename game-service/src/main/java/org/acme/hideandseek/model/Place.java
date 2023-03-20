package org.acme.hideandseek.model;

import io.quarkus.redis.datasource.geo.GeoValue;

public record Place(String name, double longitude, double latitude) {

}
