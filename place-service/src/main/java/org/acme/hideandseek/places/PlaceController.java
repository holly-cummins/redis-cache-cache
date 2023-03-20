package org.acme.hideandseek.places;

import org.jboss.resteasy.reactive.RestQuery;
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

    @GetMapping(path = "/places/search")
    public List<Place> search(@RestQuery String query) {
        return repository.search(query);
    }

}
