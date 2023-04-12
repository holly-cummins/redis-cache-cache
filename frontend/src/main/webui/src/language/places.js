export class Places {
  places = [];

  initialized = false;

  constructor() {
    fetch('http://localhost:8092/places')
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
    return this.places.find(s => {
      console.log('looking for ', name, s);
      return s.name === name;
    });
  }
}
