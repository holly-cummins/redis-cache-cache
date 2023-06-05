import { WebMercatorViewport } from '@math.gl/web-mercator';

class CoordinateConverter {
  height;

  width;

  numPoints;

  viewport;

  constructor({ places, height, width }) {
    this.height = height;
    this.width = width;
    this.processPlaces(places);
    this.numPoints = places.length;
  }

  isSinglePoint = () => this.numPoints <= 1;

  processPlaces = places => {
    // NOTE! You would think the coordinates are latitude,longitude, but redis swaps those
    const latitudes = places.map(place => place.coordinates.split(',')[1]);
    const longitudes = places.map(place => place.coordinates.split(',')[0]);

    // How many degrees we expect the map to cover
    this.minLatitude = Math.min(...latitudes);
    this.minLongitude = Math.min(...longitudes);

    const maxLatitude = Math.max(...latitudes);
    const maxLongitude = Math.max(...longitudes);
    const latitudeRange = maxLatitude - this.minLatitude;
    const longitudeRange = maxLongitude - this.minLongitude;

    // This is simple mercator projection.

    this.viewport = new WebMercatorViewport({
      width: this.width,
      height: this.height,
      longitude: this.minLongitude + longitudeRange / 2,
      latitude: this.minLatitude + latitudeRange / 2,
      zoom: 4,
      pitch: 0,
      bearing: 0,
    });

    // The max zoom determines how much of the map we can see; smaller zooms mean smaller maps, and if the zoom is too large
    // the library sometimes gives an assertion error
    this.viewport = this.viewport.fitBounds(
      [
        [this.minLongitude, this.minLatitude],
        [maxLongitude, maxLatitude],
      ],
      { maxZoom: 6, padding: 0 }
    );
  };

  // Turns latitude and longitude into x and y (left and top) coordinates.
  transform(coord) {
    // Remember, latitude and longitude are swapped in redis GEO format

    const [long, lat] = coord;
    const [x, y] = this.viewport.project([long, lat]);

    return [Math.round(x), Math.round(y)];
  }

  getCoordinatesForPlace(place) {
    if (place && place.coordinates) {
      const coordinates = place.coordinates.split(',').map(n => parseFloat(n));
      return this.transform(coordinates);
    }
    return null;
  }

  convert(place) {
    return this.getCoordinatesForPlace(place);
  }
}

export { CoordinateConverter };
