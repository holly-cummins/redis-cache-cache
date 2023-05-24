import { Discovery } from '../discovery/discovery.js';

export class Places {
  places = [];

  initialized = false;

  constructor() {
    new Discovery()
      .resolve('place', window.location.href)
      .then(location => fetch(`${location}/places`))
      .then(resp => resp.json())
      .then(array => {
        this.places = array;
        this.initialized = true;
      });
  }

  getPlaces() {
    return this.places;
  }

  getPlace(name) {
    return this.places.find(s => s.name === name);
  }
}
