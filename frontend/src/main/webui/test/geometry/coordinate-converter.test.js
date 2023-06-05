import { expect } from '@open-wc/testing';
import { CoordinateConverter } from '../../src/geometry/cooordinate-converter.js';

const maxHeight = 1000;
const maxWidth = 1500;

const places = [
  {
    key: 'places:3',
    name: 'Centre Pompidou',
    picture: '',
    description: 'Stuff',
    coordinates: '2.3522,48.8606',
  },
  {
    key: 'places:2',
    name: 'Musée d’Orsay',
    picture: '',
    description: 'Bla bla',
    coordinates: '2.3265,48.8550',
  },
  {
    key: 'places:14',
    name: 'Versailles',
    picture: '',
    description: 'Rather posh',
    coordinates: '2.1204,48.8044',
  },
];

function getPosition(converter, place) {
  const coords = converter.convert(place);
  return { x: coords[0], y: coords[1] };
}

describe('Coordinate converter', () => {
  let converter;

  // This is a bit artificial, but it's easier to make assertions about expected behaviour
  describe('when there is only one place', () => {
    const place = places[0];
    beforeEach(() => {
      converter = new CoordinateConverter({
        places: [place],
        height: maxHeight,
        width: maxWidth,
      });
    });

    it('puts the single place exactly in the middle of the map', () => {
      const { x, y } = getPosition(converter, place);

      // Floating point errors mean we can't do precise comparison. Ideally we would use chai-almost, but es6 vs cjs makes that hard
      expect(Math.round(x)).to.equal(maxWidth / 2);
      expect(Math.round(y)).to.equal(maxHeight / 2);
    });
  });

  describe('when there are two places in a column, looking at the y one', () => {
    let syntheticPlace;
    beforeEach(() => {
      const realPlace = places[0];
      const realLatLong = realPlace.coordinates.split(',');
      syntheticPlace = {
        key: 'synthetic',
        name: 'Synthetic',
        picture: '',
        description: 'Stuff',
        // Shift the latitude, leave the longitutude
        // Increasing the latitude puts it closer to north, ie the y
        coordinates: `${+realLatLong[0]},${+realLatLong[1] + 10}`,
      };

      converter = new CoordinateConverter({
        places: [syntheticPlace, realPlace],
        height: maxHeight,
        width: maxWidth,
      });
    });

    it('puts the place on the y edge in the middle', () => {
      const { x, y } = getPosition(converter, syntheticPlace);

      // Floating point errors mean we can't do precise comparison. Ideally we would use chai-almost, but es6 vs cjs makes that hard
      expect(Math.round(x)).to.equal(maxWidth / 2);
      // The y edge is 0
      expect(Math.round(y)).to.equal(0);
    });
  });

  describe('when there are two places in a column, looking at the bottom one', () => {
    const realPlace = places[0];
    const realLatLong = realPlace.coordinates.split(',');
    const syntheticPlace = {
      key: 'synthetic',
      name: 'Synthetic',
      picture: '',
      description: 'Stuff',
      // Shift the latitude, leave the longitutude
      // Decreasing the latitude puts it closer to the equator, ie the bottom
      coordinates: `${+realLatLong[0]},${+realLatLong[1] - 10}`,
    };

    beforeEach(() => {
      converter = new CoordinateConverter({
        places: [syntheticPlace, realPlace],
        width: maxWidth,
        height: maxHeight,
      });
    });

    it('puts the place on the bottom edge in the middle', () => {
      const { x, y } = getPosition(converter, syntheticPlace);

      // Floating point errors mean we can't do precise comparison. Ideally we would use chai-almost, but es6 vs cjs makes that hard
      expect(Math.round(x)).to.equal(maxWidth / 2);
      // The y edge is 0
      expect(Math.round(y)).to.equal(maxHeight);
    });
  });

  describe('when there are two places in a row, looking at the left one', () => {
    const realPlace = places[0];
    const realLatLong = realPlace.coordinates.split(',');
    const syntheticPlace = {
      key: 'synthetic',
      name: 'Synthetic',
      picture: '',
      description: 'Stuff',
      // Shift the longitude, leave the latitude
      // Decreasing the latitude puts it closer to the bottom
      coordinates: `${realLatLong[0] - 10},${+realLatLong[1]}`,
    };
    beforeEach(() => {
      converter = new CoordinateConverter({
        places: [syntheticPlace, realPlace],
        width: maxWidth,
        height: maxHeight,
      });
    });

    xit('puts the place on the x edge in the middle', () => {
      const { x } = getPosition(converter, syntheticPlace);

      // Floating point errors mean we can't do precise comparison. Ideally we would use chai-almost, but es6 vs cjs makes that hard
      expect(Math.round(x)).to.equal(0);
    });

    it('puts the place in the middle', () => {
      const { y } = getPosition(converter, syntheticPlace);

      expect(Math.round(y)).to.equal(maxHeight / 2);
    });
  });

  describe('when there are two places in a row, looking at the right one', () => {
    const realPlace = places[0];
    const realLatLong = realPlace.coordinates.split(',');
    const syntheticPlace = {
      key: 'synthetic',
      name: 'Synthetic',
      picture: '',
      description: 'Stuff',
      // Shift the longitude, leave the latitude
      // Increasing the longitude puts it closer to the right
      coordinates: `${+realLatLong[0] + 10},${+realLatLong[1]}`,
    };

    beforeEach(() => {
      converter = new CoordinateConverter({
        places: [syntheticPlace, realPlace],
        height: maxHeight,
        width: maxWidth,
      });
    });

    xit('puts the place on the right edge', () => {
      const { x } = getPosition(converter, syntheticPlace);

      // Floating point errors mean we can't do precise comparison. Ideally we would use chai-almost, but es6 vs cjs makes that hard
      expect(Math.round(x)).to.equal(maxWidth);
    });

    it('puts the place on the  in the middle', () => {
      const { y } = getPosition(converter, syntheticPlace);

      expect(Math.round(y)).to.equal(maxHeight / 2);
    });
  });

  describe('when there are two places in a diagonal', () => {
    const realPlace = places[0];
    const realLatLong = realPlace.coordinates.split(',');
    const syntheticPlace = {
      key: 'synthetic',
      name: 'Synthetic',
      picture: '',
      description: 'Stuff',
      // Shift the longitude, leave the latitude
      // Decreasing the latitude puts it closer to the bottom
      // Increasing the longitude puts it closer to the right
      coordinates: `${+realLatLong[0] + 10},${+realLatLong[1] - 10}`,
    };

    beforeEach(() => {
      converter = new CoordinateConverter({
        places: [syntheticPlace, realPlace],
        height: maxHeight,
        width: maxWidth,
      });
    });

    xit('puts the first place on the right corner', () => {
      const { x } = getPosition(converter, syntheticPlace);

      // Floating point errors mean we can't do precise comparison. Ideally we would use chai-almost, but es6 vs cjs makes that hard
      // If the canvas was square, we'd be at the y-right, but since it's not, we'll be just near the y
      // If the aspect ratio goes far above 1, this test could fail
      const heightRatio = (maxHeight / maxWidth) * converter.aspectRatio;
      const gap = ((1 - heightRatio) / 2) * maxWidth;

      expect(Math.round(x)).to.equal(Math.round(maxWidth - gap));
    });

    it('puts the first place on the bottom corner', () => {
      const { y } = getPosition(converter, syntheticPlace);

      expect(Math.round(y)).to.equal(maxHeight);
    });
  });

  describe('when data for a number of places is available', () => {
    beforeEach(() => {
      converter = new CoordinateConverter({
        places,
        height: maxHeight,
        width: maxWidth,
      });
    });

    // We don't want to reproduce the exact scaling logic in the test, so just check that things are on the page
    it('assigns a sensible position to places', () => {
      const { x, y } = getPosition(converter, places[1]);

      expect(x).to.be.greaterThanOrEqual(0);
      expect(Math.round(x)).to.be.lessThanOrEqual(maxWidth);
      expect(y).to.be.greaterThanOrEqual(0);
      expect(y).to.be.lessThanOrEqual(maxHeight);
    });
  });
});
