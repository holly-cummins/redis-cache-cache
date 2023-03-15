package org.acme.soapbox;

import io.quarkus.redis.datasource.RedisDataSource;
import io.quarkus.redis.datasource.json.JsonCommands;
import io.quarkus.redis.datasource.keys.KeyCommands;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.List;

import static org.acme.soapbox.SoapBox.toId;
import static org.springframework.http.HttpStatus.NOT_FOUND;

@RestController("/")
public class SoapBoxResource {

    // TODO Repository
    // TODO Should we use a set instead of iterating over keys?

    private final JsonCommands<String> json;
    private final KeyCommands<String> keys;
    private final RedisDataSource redis;

    public SoapBoxResource(RedisDataSource ds) {
        json = ds.json();
        keys = ds.key();
        redis = ds;
    }

    @GetMapping
    public List<SoapBox> all() {
        List<SoapBox> all = new ArrayList<>();
        for (String key : keys.keys("soapbox:*")) {
            all.add(json.jsonGet(key, SoapBox.class));
        }
        return all;
    }

    @GetMapping(path = "/{name}")
    public SoapBox one(String name) {
        var found = json.jsonGet("soapbox:" + toId(name), SoapBox.class);
        if (found == null) {
            throw new ResponseStatusException(NOT_FOUND, "Missing soapbox");
        }
        return found;
    }

    @PostMapping
    @ResponseStatus(code = HttpStatus.CREATED)
    public void create(SoapBox soapbox) {
        json.jsonSet("soapbox:" + soapbox.id(), soapbox);
    }

    @DeleteMapping(path = "/{name}")
    public void delete(String name) {
        if (keys.del("soapbox:" + toId(name)) != 1) {
            throw new ResponseStatusException(NOT_FOUND, "Missing soapbox");
        }
    }

    @PutMapping(path = "/{name}")
    public SoapBox update(String name, SoapBox soapbox) {
        // Check-and-Set pattern
        redis.withTransaction(
                // Before transaction
                ds -> {
                    var found = ds.json().jsonGet("soapbox:" + toId(name), SoapBox.class);
                    if (found == null) {
                        throw new ResponseStatusException(NOT_FOUND, "Missing soapbox");
                    }
                    return found;
                },
                // Transactional block
                (found, tx) -> {
                    // Write new soapbox
                    tx.json().jsonSet("soapbox:" + soapbox.id(), "$", soapbox);
                    // Delete the old one if needed
                    if (!found.name().equals(soapbox.name())) {
                        tx.key().del("soapbox:" + toId(found.name()));
                    }
                },
                // Watched keys
                "soapbox:" + soapbox.id(), "soapbox:" + toId(name)
        );
        return soapbox;
    }

}
