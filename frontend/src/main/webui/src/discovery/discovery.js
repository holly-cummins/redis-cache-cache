export class Discovery {
  static locations = {};

  static initialized = false;

  async resolve(serviceName) {
    if (!this.initialized) {
      await fetch(`/discovery`)
        .then(resp => resp.json())
        .then(val => {
          Discovery.locations = val;
          Discovery.initialized = true;
        });
    }

    return Discovery.locations[serviceName];
  }
}
