export class Discovery {
  static locations = {};

  static initialized = false;

  async resolve(serviceName, currentLocation) {
    if (!this.initialized) {
      await fetch(`/discovery?current=${currentLocation}`)
        .then(resp => resp.json())
        .then(val => {
          Discovery.locations = val;
          Discovery.initialized = true;
        });
    }

    return Discovery.locations[serviceName];
  }
}
