package org.acme.hideandseek;

import org.springframework.context.annotation.Bean;
import org.springframework.stereotype.Component;
import org.springframework.stereotype.Service;

import javax.enterprise.context.ApplicationScoped;
import java.util.UUID;

@Service
public class IdGenerator {

    public String generate() {
        return UUID.randomUUID().toString();
    }

}
