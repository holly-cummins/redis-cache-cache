import { html } from 'lit';
import { expect, fixture, waitUntil } from '@open-wc/testing';
import sinon from 'sinon';
import '../src/components/map-view.js';

const coordsPattern = /left:(-?[0-9.]+)px; top:(-?[0-9.]+)px/;

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

const mockApiResponse = (body = {}) =>
  Promise.resolve(
    new window.Response(JSON.stringify(body), {
      status: 200,
      headers: { 'Content-type': 'application/json' },
    })
  );

function getPosition(element) {
  const place = element.shadowRoot.querySelector('.place');
  expect(place).to.exist;
  const style = place.getAttribute('style');
  expect(style).to.contain('left');
  const matches = style.match(coordsPattern);
  const left = +matches[1];
  const top = +matches[2];
  return { left, top };
}

function getMapDimensions(element) {
  const map = element.shadowRoot.querySelector('.map');
  const boundingBox = map.getBoundingClientRect();
  const borderWidth = window
    .getComputedStyle(map)
    .borderWidth.replace('px', '');

  // We need to take off something for the border
  const maxHeight = boundingBox.height - 2 * borderWidth;
  const maxWidth = boundingBox.width - 2 * borderWidth;
  return { maxHeight, maxWidth };
}

describe('Map view', () => {
  let element;
  describe('in the absence of data', () => {
    beforeEach(async () => {
      element = await fixture(html` <map-view></map-view>`);
    });

    it('passes the a11y audit', async () => {
      await expect(element).shadowDom.to.be.accessible();
    });
  });

  // This is a bit artificial, but it's easier to make assertions about expected behaviour
  describe('when there is only one place', () => {
    beforeEach(async () => {
      const stubbedFetch = sinon.stub(window, 'fetch');
      stubbedFetch.returns(mockApiResponse([places[0]]));

      element = await fixture(html` <map-view></map-view>`);
      // wait until data has been set
      await waitUntil(
        () => element.places,
        'Element did not populate its data'
      );
    });

    afterEach(() => {
      window.fetch.restore(); // remove stub
    });

    it('renders the place names', () => {
      expect(element.shadowRoot.textContent).to.contain('Centre Pompidou');
    });

    it('puts the single place exactly in the middle of the map', () => {
      const { left, top } = getPosition(element);

      const { maxHeight, maxWidth } = getMapDimensions(element);

      // Floating point errors mean we can't do precise comparison. Ideally we would use chai-almost, but es6 vs cjs makes that hard
      expect(Math.round(left)).to.equal(maxWidth / 2);
      expect(Math.round(top)).to.equal(maxHeight / 2);
    });
  });

  describe('when there are two places in a column, looking at the top one', () => {
    beforeEach(async () => {
      const stubbedFetch = sinon.stub(window, 'fetch');
      const realPlace = places[0];
      const realLatLong = realPlace.coordinates.split(',');
      const syntheticPlace = {
        key: 'synthetic',
        name: 'Synthetic',
        picture: '',
        description: 'Stuff',
        // Shift the latitude, leave the longitutude
        // Increasing the latitude puts it closer to north, ie the top
        coordinates: `${+realLatLong[0]},${+realLatLong[1] + 10}`,
      };

      stubbedFetch.returns(mockApiResponse([syntheticPlace, realPlace]));

      element = await fixture(html` <map-view></map-view>`);
      // wait until data has been set
      await waitUntil(
        () => element.places,
        'Element did not populate its data'
      );
    });

    afterEach(() => {
      window.fetch.restore(); // remove stub
    });

    it('renders the place names', () => {
      expect(element.shadowRoot.textContent).to.contain('Synthetic');
    });

    it('puts the single place on the top edge in the middle', () => {
      const { left, top } = getPosition(element);

      const { maxWidth } = getMapDimensions(element);

      // Floating point errors mean we can't do precise comparison. Ideally we would use chai-almost, but es6 vs cjs makes that hard
      expect(Math.round(left)).to.equal(maxWidth / 2);
      // The top edge is 0
      expect(Math.round(top)).to.equal(0);
    });
  });

  describe('when there are two places in a column, looking at the bottom one', () => {
    beforeEach(async () => {
      const stubbedFetch = sinon.stub(window, 'fetch');
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
      stubbedFetch.returns(mockApiResponse([syntheticPlace, realPlace]));

      element = await fixture(html` <map-view></map-view>`);
      // wait until data has been set
      await waitUntil(
        () => element.places,
        'Element did not populate its data'
      );
    });

    afterEach(() => {
      window.fetch.restore(); // remove stub
    });

    it('renders the place names', () => {
      expect(element.shadowRoot.textContent).to.contain('Synthetic');
    });

    it('puts the single place on the bottom edge in the middle', () => {
      const { left, top } = getPosition(element);

      const { maxHeight, maxWidth } = getMapDimensions(element);

      // Floating point errors mean we can't do precise comparison. Ideally we would use chai-almost, but es6 vs cjs makes that hard
      expect(Math.round(left)).to.equal(maxWidth / 2);
      // The top edge is 0
      expect(Math.round(top)).to.equal(maxHeight);
    });
  });

  describe('when there are two places in a row, looking at the left one', () => {
    beforeEach(async () => {
      const stubbedFetch = sinon.stub(window, 'fetch');
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
      stubbedFetch.returns(mockApiResponse([syntheticPlace, realPlace]));

      element = await fixture(html` <map-view></map-view>`);
      // wait until data has been set
      await waitUntil(
        () => element.places,
        'Element did not populate its data'
      );
    });

    afterEach(() => {
      window.fetch.restore(); // remove stub
    });

    it('renders the place names', () => {
      expect(element.shadowRoot.textContent).to.contain('Synthetic');
    });

    it('puts the single place on the left edge in the middle', () => {
      const { left, top } = getPosition(element);

      const { maxHeight } = getMapDimensions(element);

      // Floating point errors mean we can't do precise comparison. Ideally we would use chai-almost, but es6 vs cjs makes that hard
      expect(Math.round(left)).to.equal(0);
      // The top edge is 0
      expect(Math.round(top)).to.equal(maxHeight / 2);
    });
  });

  describe('when there are two places in a row, looking at the right one', () => {
    beforeEach(async () => {
      const stubbedFetch = sinon.stub(window, 'fetch');
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
      stubbedFetch.returns(mockApiResponse([syntheticPlace, realPlace]));

      element = await fixture(html` <map-view></map-view>`);
      // wait until data has been set
      await waitUntil(
        () => element.places,
        'Element did not populate its data'
      );
    });

    afterEach(() => {
      window.fetch.restore(); // remove stub
    });

    it('renders the place names', () => {
      expect(element.shadowRoot.textContent).to.contain('Synthetic');
    });

    it('puts the single place on the right edge in the middle', () => {
      const { left, top } = getPosition(element);

      const { maxHeight, maxWidth } = getMapDimensions(element);

      // Floating point errors mean we can't do precise comparison. Ideally we would use chai-almost, but es6 vs cjs makes that hard
      expect(Math.round(left)).to.equal(maxWidth);
      // The top edge is 0
      expect(Math.round(top)).to.equal(maxHeight / 2);
    });
  });

  describe('when there are two places in a diagonal', () => {
    beforeEach(async () => {
      const stubbedFetch = sinon.stub(window, 'fetch');
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
      stubbedFetch.returns(mockApiResponse([syntheticPlace, realPlace]));

      element = await fixture(html` <map-view></map-view>`);
      // wait until data has been set
      await waitUntil(
        () => element.places,
        'Element did not populate its data'
      );
    });

    afterEach(() => {
      window.fetch.restore(); // remove stub
    });

    it('renders the place names', () => {
      expect(element.shadowRoot.textContent).to.contain('Synthetic');
    });

    it('puts the first place on the right-bottom corner', () => {
      const { left, top } = getPosition(element);

      const { maxHeight, maxWidth } = getMapDimensions(element);

      // Floating point errors mean we can't do precise comparison. Ideally we would use chai-almost, but es6 vs cjs makes that hard
      // If the canvas was square, we'd be at the top-right, but since it's not, we'll be just near the top
      // If the aspect ratio goes far above 1, this test could fail
      const heightRatio = (maxHeight / maxWidth) * element.aspectRatio;
      const gap = ((1 - heightRatio) / 2) * maxWidth;
      expect(Math.round(left)).to.equal(Math.round(maxWidth - gap));
      expect(Math.round(top)).to.equal(maxHeight);
    });
  });

  describe('when data for a number of places is available', () => {
    beforeEach(async () => {
      const stubbedFetch = sinon.stub(window, 'fetch');
      stubbedFetch.returns(mockApiResponse(places));

      element = await fixture(html` <map-view></map-view>`);
      // wait until data has been set
      await waitUntil(
        () => element.places,
        'Element did not populate its data'
      );
    });

    afterEach(() => {
      window.fetch.restore(); // remove stub
    });

    it('renders the place names', () => {
      expect(element.shadowRoot.textContent).to.contain('Centre Pompidou');
      expect(element.shadowRoot.textContent).to.contain('Musée d’Orsay');
    });

    // We don't want to reproduce the exact scaling logic in the test, so just check that the value is sensible
    it('works out a plausible scale factor', () => {
      expect(element.scaleFactor).to.be.greaterThan(100);
      expect(element.scaleFactor).to.be.lessThan(40000);
    });

    it('works out a plausible latitude offset', () => {
      expect(element.latitudeOffset).to.be.greaterThan(47);
      expect(element.latitudeOffset).to.be.lessThan(49);
    });

    it('works out a plausible longitude offset', () => {
      expect(element.longitudeOffset).to.be.greaterThan(2.1);
      expect(element.longitudeOffset).to.be.lessThan(3);
    });

    // We don't want to reproduce the exact scaling logic in the test, so just check that things are on the page
    it('assigns a sensible position to places', () => {
      const { left, top } = getPosition(element);
      const { maxHeight, maxWidth } = getMapDimensions(element);

      expect(left).to.be.greaterThanOrEqual(0);
      expect(Math.round(left)).to.be.lessThanOrEqual(maxWidth);
      expect(top).to.be.greaterThanOrEqual(0);
      expect(top).to.be.lessThanOrEqual(maxHeight);
    });

    it('passes the a11y audit', async () => {
      await expect(element).shadowDom.to.be.accessible();
    });
  });
});
