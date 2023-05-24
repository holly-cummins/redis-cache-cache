# Deploying the demo to OpenShift / Kubernetes


## Prerequisites

- You need an OpenShift instance. You can use the OpenShift Sandbox
- Make sure you are logged in to the sandbox
- Change the image group `quarkus.container-image.group=cescoffier` to your own Docker name
- Make sure you are logged in to the docker hub registry
- Make sure you have the Redis Cloud url

## Preparation

- Create the `kubernetes/secret-redis.yaml` file with:

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: redis
  annotations:
    kubernetes.io/service-account.name: "redis"
type: opaque
data:
  redis-url: "<Base64-Encoded-Redis-URL>"
```

NOTE: to generate the base64 encoded redis url: `echo -n $URL | base64`

- Apply the kubernetes resources (both the secrets and the `routes.yaml`): `kubectl apply -f ./kubernetes`

## Build and Deploy

For each module run:

```bash
quarkus build --clean -Dquarkus.container-image.push=true -DskipTests  && quarkus deploy kubernetes
```