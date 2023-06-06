package org.acme.hideandseek.discovery;

import io.fabric8.openshift.client.OpenShiftClient;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

@ApplicationScoped
public class OpenshiftLookup {

    @Inject
    OpenShiftClient client;

    public boolean isOpenShift(String currentLocation) {
        if (currentLocation.contains("localhost:")) {
            return false;
        }
        if (currentLocation.contains("0.0.0.0")) {
            return false;
        }
        try {
            client.getVersion();
        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
        return true;
    }

    public String resolve(String serviceName) {
        return client.routes().list().getItems().stream()
                .filter(r -> {
                    if ("service".equalsIgnoreCase(r.getSpec().getTo().getKind())) {
                        return serviceName.equalsIgnoreCase(r.getSpec().getTo().getName());
                    }
                    return false;
                })
                .map(r -> {
                    if (r.getSpec().getTls() != null) {
                        return "https://" + r.getSpec().getHost();
                    } else {
                        return "http://" + r.getSpec().getHost();
                    }
                })
                .findAny().orElseThrow();
    }

}
