package org.acme.hideandseek;

import io.quarkus.redis.datasource.geo.GeoValue;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
public class PlaceController {

    private final PlaceRepository repository;

    PlaceController(PlaceRepository repository) {
        this.repository = repository;
    }

    @GetMapping(path = "/places")
    public List<Place> getAllPlaces() {
        return repository.getPlaces();
    }

}
