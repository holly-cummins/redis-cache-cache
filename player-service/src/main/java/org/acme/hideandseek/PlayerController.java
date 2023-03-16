package org.acme.hideandseek;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.net.URI;
import java.net.URISyntaxException;
import java.util.List;

import static org.springframework.http.HttpStatus.BAD_REQUEST;
import static org.springframework.http.HttpStatus.NOT_FOUND;

@RestController("/")
public class PlayerController {

    private static final String NOT_FOUND_MESSAGE = "Missing player, or too well hidden";
    private final PlayerRepository repository;

    PlayerController(PlayerRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public List<Player> getAll() {
        return repository.getAll();
    }

    @GetMapping(path = "/{id}")
    public Player getOne(String id) {
        var found = repository.getOne(id);
        if (found == null) {
            throw new ResponseStatusException(NOT_FOUND, NOT_FOUND_MESSAGE);
        }
        return found;
    }

    @PostMapping
    @ResponseStatus(code = HttpStatus.CREATED)
    public ResponseEntity<Player> create(Player player) throws URISyntaxException {
        var persisted = repository.create(player);
        if (persisted != null) {
            return ResponseEntity.created(new URI("/" + persisted.id())).body(persisted);
        } else {
            throw new ResponseStatusException(BAD_REQUEST, "Cannot create player");
        }

    }

    @DeleteMapping(path = "/{id}")
    public void delete(String id) {
        if (!repository.delete(id)) {
            throw new ResponseStatusException(NOT_FOUND, NOT_FOUND_MESSAGE);
        }
    }

    @PutMapping(path = "/{id}")
    public Player update(String id, Player player) {
        if (repository.update(id, player)) {
            return player;
        } else {
            throw new ResponseStatusException(NOT_FOUND, NOT_FOUND_MESSAGE);
        }
    }
}
