package org.acme.hideandseek.discovery;

import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

@QuarkusTest
class OpenshiftLookupTest {

    @Inject
    OpenshiftLookup lookup;

    @Test
    public void shouldUnderstandLocalHostIsNotOpenShift() {
        assertFalse(lookup.isOpenShift("http://localhost:8080/something"));
    }

    @Test
    public void shouldUnderstandGenericInterfacesIsNotOpenShift() {
        assertFalse(lookup.isOpenShift("http://0.0.0.0:8080/something"));
    }

    @Test
    public void shouldNotSayArbitraryNetworksAreOpenShiftWhenRunningLocally() {
        assertFalse(lookup.isOpenShift("http://whatever/something"));
    }

}