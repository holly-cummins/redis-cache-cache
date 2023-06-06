package org.acme.hideandseek.discovery;

import io.fabric8.kubernetes.client.KubernetesClientException;
import io.fabric8.kubernetes.client.VersionInfo;
import io.fabric8.openshift.client.OpenShiftClient;
import io.quarkus.test.junit.QuarkusTest;
import io.quarkus.test.junit.mockito.InjectMock;
import jakarta.inject.Inject;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.doReturn;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.when;

@QuarkusTest
class OpenshiftLookupTest {

    @Inject
    OpenshiftLookup lookup;

    @InjectMock(convertScopes = true)
    OpenShiftClient client;

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
        doThrow(new KubernetesClientException("Deliberate error")).when(client).getVersion();
        assertFalse(lookup.isOpenShift("http://whatever/something"));
    }

    @Test
    public void shouldCorrectlyIdentifyOpenShift() {
       doReturn(new VersionInfo.Builder().build()).when(client).getVersion();
       assertTrue(lookup.isOpenShift("http://whatever/something"));
    }

}