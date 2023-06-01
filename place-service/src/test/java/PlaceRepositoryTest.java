import io.quarkus.redis.datasource.RedisDataSource;
import io.quarkus.redis.datasource.geo.GeoSearchArgs;
import io.quarkus.redis.datasource.geo.GeoUnit;
import io.quarkus.test.junit.QuarkusTest;
import io.restassured.common.mapper.TypeRef;
import jakarta.inject.Inject;
import org.acme.hideandseek.places.Place;
import org.acme.hideandseek.places.PlaceRepository;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import java.util.List;

import static io.restassured.RestAssured.get;
import static io.restassured.RestAssured.with;
import static org.hamcrest.Matchers.equalTo;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

@QuarkusTest
class PlaceRepositoryTest {

    @Autowired
    PlaceRepository repository;

    @Autowired
    RedisDataSource redis;

    @Test
    void testAllPlaces() {
        var places = repository.getPlaces();
        for (Place place : places) {
            Assertions.assertNotNull(place.coordinates());
            Assertions.assertNotNull(place.name());
            Assertions.assertNotNull(place.description());
        }
    }

    @Test
    void testSearch() {
        var old = repository.search("old");
        Assertions.assertEquals(3, old.size());
        for (Place place : old) {
            Assertions.assertNotNull(place.coordinates());
            Assertions.assertNotNull(place.name());
            Assertions.assertNotNull(place.description());
        }

        var brouette = repository.search("brouette");
        Assertions.assertTrue(brouette.isEmpty());
    }

    @Test
    void testGeoIndices() {
        var place = repository.getPlaces().get(0);
        var list = redis.geo(String.class).geosearch("hide-and-seek:geo", new GeoSearchArgs<String>().fromMember(place.name()).withDistance().byRadius(3000, GeoUnit.KM));
        Assertions.assertEquals(repository.getPlaces().size(), list.size());
    }
}