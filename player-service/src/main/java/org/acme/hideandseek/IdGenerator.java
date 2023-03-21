package org.acme.hideandseek;

import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
public class IdGenerator {

    public String generate() {
        return UUID.randomUUID().toString();
    }

}
