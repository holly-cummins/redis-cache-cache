class CoordinateConverter {
  height;

  width;

  scaleFactor;

  numPoints;

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

    const latitudeRange = Math.max(...latitudes) - this.minLatitude;
    const longitudeRange = Math.max(...longitudes) - this.minLongitude;

    // This is simple equirectangular projection. The npm package proj4 would be more precise, but also harder
    // See https://stackoverflow.com/questions/16266809/convert-from-latitude-longitude-to-x-y for details
    // Convert degrees to radians
    const latitudeInRadians = (this.minLatitude / 180) * Math.PI;

    // This adjusts the up-and-down-squishedness of the map
    // We can use a geographically 'correct' value, or tune it to look good
    // No matter what value we set for this, the tests should still pass
    this.aspectRatio = Math.cos(latitudeInRadians);

    // This is only needed for single-point or row or column cases, and the exact value doesn't matter then
    // If there's only one point, aim to show about 5% of the map
    const defaultScaleFactor = this.height * 0.8;

    // check height and width both to make sure it fits
    this.scaleFactor = Math.min(
      longitudeRange > 0
        ? this.width / (longitudeRange * this.aspectRatio)
        : defaultScaleFactor,
      latitudeRange > 0 ? this.height / latitudeRange : defaultScaleFactor
    );

    this.heightInDegrees = this.height / this.scaleFactor;
    this.widthInDegrees = this.width / (this.scaleFactor * this.aspectRatio);

    this.latitudeOffset =
      this.minLatitude - (this.heightInDegrees - latitudeRange) / 2;
    this.longitudeOffset =
      this.minLongitude - (this.widthInDegrees - longitudeRange) / 2;
  };

  // Turns latitude and longitude into x and y (left and top) coordinates.
  transform(coord) {
    // Remember, latitude and longitude are the opposite order from x and y, so we *would* swap them
    // ... except that redis GEO format *already* swaps them!

    // We also need to shift our coordinate system from (0,0) being in bottom-left corner to (0,0) being in the top-left corner

    const x =
      (coord[0] - this.longitudeOffset) * this.scaleFactor * this.aspectRatio;
    const y = this.height - (coord[1] - this.latitudeOffset) * this.scaleFactor;

    return [x, y];
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
