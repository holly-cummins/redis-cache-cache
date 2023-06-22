package org.acme.hideandseek.discovery;

import io.fabric8.openshift.client.OpenShiftClient;
import io.smallrye.mutiny.Uni;
import io.smallrye.mutiny.infrastructure.Infrastructure;
import io.smallrye.stork.api.ServiceDiscovery;
import io.smallrye.stork.api.ServiceInstance;
import io.smallrye.stork.api.config.ServiceConfig;
import io.smallrye.stork.api.config.ServiceDiscoveryType;
import io.smallrye.stork.impl.DefaultServiceInstance;
import io.smallrye.stork.spi.ServiceDiscoveryProvider;
import io.smallrye.stork.spi.StorkInfrastructure;
import io.smallrye.stork.utils.ServiceInstanceIds;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.inject.Instance;
import jakarta.inject.Inject;

import java.util.Collections;
import java.util.List;

@ServiceDiscoveryType("openshift-route")
@ApplicationScoped
public class OpenShiftRouteServiceDiscoveryProvider implements ServiceDiscoveryProvider<OpenshiftRouteConfiguration> {

    @Inject
    Instance<OpenShiftClient> client;

    @Override
    public ServiceDiscovery createServiceDiscovery(OpenshiftRouteConfiguration openShiftRouteConfiguration, String serviceName, ServiceConfig serviceConfig, StorkInfrastructure storkInfrastructure) {
        return new OpenshiftRouteServiceDiscovery(serviceName);
    }

    private class OpenshiftRouteServiceDiscovery implements ServiceDiscovery {
        private final String name;

        public OpenshiftRouteServiceDiscovery(String serviceName) {
            this.name = serviceName;
        }

        @Override
        public Uni<List<ServiceInstance>> getServiceInstances() {
            if (!client.isResolvable()) {
                return Uni.createFrom().item(Collections.emptyList());
            }
            return Uni.createFrom().item(() -> {
                ServiceInstance si = new DefaultServiceInstance(ServiceInstanceIds.next(), resolve(name), 443, true);
                return List.of(si);
            }).runSubscriptionOn(Infrastructure.getDefaultExecutor());
        }

        public String resolve(String serviceName) {
            return client.get().routes().list().getItems().stream()
                    .filter(r -> {
                        if ("service".equalsIgnoreCase(r.getSpec().getTo().getKind())) {
                            return serviceName.equalsIgnoreCase(r.getSpec().getTo().getName());
                        }
                        return false;
                    })
                    .map(r -> r.getSpec().getHost())
                    .findAny().orElseThrow();
        }
    }
}
