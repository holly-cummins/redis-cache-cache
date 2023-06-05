import { html } from 'lit';
import { expect, fixture, waitUntil } from '@open-wc/testing';
import sinon from 'sinon';

import '../../src/components/map-view.js';
import { Discovery } from '../../src/discovery/discovery.js';

const coordsPattern = /left:(-?[0-9.]+)px; top:(-?[0-9.]+)px/;

// the exact values here don't matter, something just needs to return
const resolvedUrl = 'http://irrelevant';

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
  expect(style).to.match(coordsPattern);
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
      sinon.stub(Discovery.prototype, 'resolve').resolves(resolvedUrl);
      element = await fixture(html` <map-view></map-view>`);
    });

    afterEach(async () => {
      sinon.restore();
    });

    it('passes the a11y audit', async () => {
      await expect(element).shadowDom.to.be.accessible();
    });
  });

  describe('when populating all places', () => {
    const triggerPopulate = () => {
      window.dispatchEvent(
        new CustomEvent('add-all-places', {
          composed: true,
        })
      );
    };

    // This is a bit artificial, but it's easier to make assertions about expected behaviour
    describe('when there is only one place', () => {
      beforeEach(async () => {
        sinon.stub(Discovery.prototype, 'resolve').resolves(resolvedUrl);
        const stubbedFetch = sinon.stub(window, 'fetch');
        stubbedFetch.returns(mockApiResponse([places[0]]));

        element = await fixture(html` <map-view></map-view>`);
        triggerPopulate();
        // wait until data has been set
        await waitUntil(
          () => element.places,
          'Map did not populate place data'
        );
      });

      afterEach(() => {
        window.fetch.restore(); // remove stub
        sinon.restore();
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
        sinon.stub(Discovery.prototype, 'resolve').resolves(resolvedUrl);
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
        triggerPopulate();
        // wait until data has been set
        await waitUntil(
          () => element.places,
          'Map did not populate place data for two places'
        );
      });

      afterEach(() => {
        window.fetch.restore(); // remove stub
        sinon.restore();
      });

      it('renders the place names', () => {
        expect(element.shadowRoot.textContent).to.contain('Synthetic');
      });

      it('puts the place on the top edge in the middle', () => {
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
        sinon.stub(Discovery.prototype, 'resolve').resolves(resolvedUrl);
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
        triggerPopulate();
        // wait until data has been set
        await waitUntil(() => element.places, 'Map did not populate its data');
      });

      afterEach(() => {
        window.fetch.restore(); // remove stub
        sinon.restore();
      });

      it('renders the place names', () => {
        expect(element.shadowRoot.textContent).to.contain('Synthetic');
      });

      it('puts the place on the bottom edge in the middle', () => {
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
        sinon.stub(Discovery.prototype, 'resolve').resolves(resolvedUrl);
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
        triggerPopulate();
        // wait until data has been set
        await waitUntil(() => element.places, 'Map did not populate its data');
      });

      afterEach(() => {
        window.fetch.restore(); // remove stub
        sinon.restore();
      });

      it('renders the place names', () => {
        expect(element.shadowRoot.textContent).to.contain('Synthetic');
      });

      xit('puts the place on the left edge in the middle', () => {
        const { left } = getPosition(element);

        // Floating point errors mean we can't do precise comparison. Ideally we would use chai-almost, but es6 vs cjs makes that hard
        expect(Math.round(left)).to.equal(0);
      });

      it('puts the place in the middle', () => {
        const { top } = getPosition(element);

        const { maxHeight } = getMapDimensions(element);

        expect(Math.round(top)).to.equal(maxHeight / 2);
      });
    });

    describe('when there are two places in a row, looking at the right one', () => {
      beforeEach(async () => {
        sinon.stub(Discovery.prototype, 'resolve').resolves(resolvedUrl);
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
        triggerPopulate();
        // wait until data has been set
        await waitUntil(() => element.places, 'Map did not populate its data');
      });

      afterEach(() => {
        window.fetch.restore(); // remove stub
        sinon.restore();
      });

      it('renders the place names', () => {
        expect(element.shadowRoot.textContent).to.contain('Synthetic');
      });

      xit('puts the place  in the middle', () => {
        const { left } = getPosition(element);

        const { maxWidth } = getMapDimensions(element);

        // Floating point errors mean we can't do precise comparison. Ideally we would use chai-almost, but es6 vs cjs makes that hard
        expect(Math.round(left)).to.equal(maxWidth);
      });

      it('puts the place on the in the middle', () => {
        const { top } = getPosition(element);

        const { maxHeight } = getMapDimensions(element);

        expect(Math.round(top)).to.equal(maxHeight / 2);
      });
    });

    describe('when there are two places in a diagonal', () => {
      beforeEach(async () => {
        sinon.stub(Discovery.prototype, 'resolve').resolves(resolvedUrl);
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
        triggerPopulate();
        // wait until data has been set
        await waitUntil(
          () => element.places,
          'Element did not populate its data'
        );
      });

      afterEach(() => {
        window.fetch.restore(); // remove stub
        sinon.restore();
      });

      it('renders the place names', () => {
        expect(element.shadowRoot.textContent).to.contain('Synthetic');
      });

      xit('puts the first place on the right corner', () => {
        const { left } = getPosition(element);

        const { maxHeight, maxWidth } = getMapDimensions(element);

        // Floating point errors mean we can't do precise comparison. Ideally we would use chai-almost, but es6 vs cjs makes that hard
        // If the canvas was square, we'd be at the top-right, but since it's not, we'll be just near the top
        // If the aspect ratio goes far above 1, this test could fail
        const heightRatio =
          (maxHeight / maxWidth) * element.coordinateConverter.aspectRatio;
        const gap = ((1 - heightRatio) / 2) * maxWidth;
        expect(Math.round(left)).to.equal(Math.round(maxWidth - gap));
      });

      it('puts the first place on the bottom corner', () => {
        const { top } = getPosition(element);

        const { maxHeight } = getMapDimensions(element);

        expect(Math.round(top)).to.equal(maxHeight);
      });
    });

    describe('when data for a number of places is available', () => {
      beforeEach(async () => {
        sinon.stub(Discovery.prototype, 'resolve').resolves(resolvedUrl);
        const stubbedFetch = sinon.stub(window, 'fetch');
        stubbedFetch.returns(mockApiResponse(places));

        element = await fixture(html` <map-view></map-view>`);
        triggerPopulate();
        // wait until data has been set
        await waitUntil(() => element.places, 'Map did not populate its data');
      });

      afterEach(() => {
        window.fetch.restore(); // remove stub
        sinon.restore();
      });

      it('renders the place names', () => {
        expect(element.shadowRoot.textContent).to.contain('Centre Pompidou');
        expect(element.shadowRoot.textContent).to.contain('Musée d’Orsay');
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
      }).timeout(10000);
    });

    describe('when events are streamed', () => {
      const sources = {};

      // There seems to be some es6/cjs issue with eventsourcemock, so home roll a mock
      class MockEventSource {
        constructor(url) {
          sources[url] = this;
        }

        close() {}
      }

      Object.defineProperty(window, 'EventSource', {
        writable: true,
        value: MockEventSource,
      });

      const emit = data => {
        sources[`${resolvedUrl}/games/events`]?.onmessage({
          data: JSON.stringify(data),
        });
      };

      const emitAndWait = async data => {
        emit(data);
        // wait until data has been set

        return waitUntil(
          () => element.positions,
          'Map did not populate event data on SSE emit'
        );
      };

      beforeEach(async () => {
        sinon.stub(Discovery.prototype, 'resolve').resolves(resolvedUrl);
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
        triggerPopulate();
        // wait until data has been set
        await waitUntil(
          () => element.places,
          'Map did not populate place data (needed for events)'
        );
      });

      afterEach(() => {
        window.fetch.restore(); // remove stub
        sinon.restore();
      });

      it('renders seeker move events', async () => {
        let place = element.shadowRoot.querySelector('.place');
        expect(place.textContent).to.contain('Synthetic');
        expect(place.className).to.not.contain('active');

        await emitAndWait({
          destination: 'Sacré Coeur',
          distance: 1029.3517,
          duration: 34,
          gameId: '59e0557d-8c16-43cc-a63c-446b0a06bed5',
          kind: 'SEEKER_MOVE',
          place: 'Synthetic',
          seeker: 'fakeman',
        });

        place = element.shadowRoot.querySelector('.place');
        expect(place.textContent).to.contain('Synthetic');
        expect(place.className).to.contain('visited');

        // TODO need to check we wiped the old one
      });
    });
  });

  describe('when adding individual places', () => {
    let stubbedFetch;
    const triggerPopulate = place => {
      window.dispatchEvent(
        new CustomEvent('add-place', {
          composed: true,
          detail: { place },
        })
      );
    };

    beforeEach(async () => {
      sinon.stub(Discovery.prototype, 'resolve').resolves(resolvedUrl);
      stubbedFetch = sinon.stub(window, 'fetch');
      stubbedFetch.returns(mockApiResponse([places[0]]));

      element = await fixture(html` <map-view></map-view>`);
      triggerPopulate('Synthetic');
      // wait until data has been set
      await waitUntil(
        () => element.places,
        'Map did not populate place data when adding individual places'
      );
    });

    afterEach(() => {
      window.fetch.restore(); // remove stub
      sinon.restore();
    });

    it('renders the place name', () => {
      expect(element.shadowRoot.textContent).to.contain('Centre Pompidou');
    });

    it('puts the place exactly in the middle of the map', () => {
      const { left, top } = getPosition(element);

      const { maxHeight, maxWidth } = getMapDimensions(element);

      // Floating point errors mean we can't do precise comparison. Ideally we would use chai-almost, but es6 vs cjs makes that hard
      expect(Math.round(left)).to.equal(maxWidth / 2);
      expect(Math.round(top)).to.equal(maxHeight / 2);
    });

    it('adds subsequent places without overwriting existing places', async () => {
      expect(element.shadowRoot.textContent).to.contain('Centre Pompidou');
      const secondPlace = places[1];
      stubbedFetch.returns(mockApiResponse([secondPlace]));
      triggerPopulate(secondPlace.name);
      // wait until data has been updated
      await waitUntil(
        () => element.places?.length > 1,
        'Map did not add to place data when adding individual places'
      );
      expect(element.shadowRoot.textContent).to.contain('Centre Pompidou');
      expect(element.shadowRoot.textContent).to.contain(secondPlace.name);
    });

    it('strips out duplicates when adding places', async () => {
      expect(element.shadowRoot.textContent).to.contain('Centre Pompidou');
      const secondPlace = places[1];
      stubbedFetch.returns(mockApiResponse([secondPlace]));
      triggerPopulate(secondPlace.name);
      // wait until data has been updated
      await waitUntil(
        () => element.places?.length > 1,
        'Map did not add to place data when adding individual places'
      );
      const firstPlace = places[0];
      stubbedFetch.returns(mockApiResponse([firstPlace]));
      triggerPopulate(firstPlace.name);
      // wait until data has been updated; we are assuming an order in the places array to detect the update
      await waitUntil(
        () => element.places[0].name === firstPlace.name,
        'Map did not add to place data, or did not add it in the expected order'
      );
      expect(element.shadowRoot.textContent).to.contain('Centre Pompidou');
      // We should only have the entry on the map once
      expect(element.shadowRoot.textContent).not.to.match(
        new RegExp(`${firstPlace.name}.*${firstPlace.name}`, 's')
      );
    });

    it('gracefully handles non-existent places', async () => {
      const nonexistent = 'nonexistent';
      expect(element.shadowRoot.textContent).to.contain('Centre Pompidou');

      // Take some care defining our stubs
      // Discovery is async, which means fetching is multithreaded, so if we are unlucky the same
      // response will be returned twice by sinon. Checks like onFirstCall do not seem to be enough
      // to avoid hitting the same instance twice, because concurrency is hard ... but specific
      // value checks do the trick
      stubbedFetch
        .withArgs(sinon.match(arg => arg.endsWith(nonexistent)))
        .returns(mockApiResponse([]));
      const secondPlace = places[1];
      stubbedFetch
        .withArgs(sinon.match(arg => arg.endsWith(secondPlace.name)))
        .returns(mockApiResponse([secondPlace]));
      triggerPopulate(nonexistent);
      // it is hard to wait until data has been updated since no update is expected
      // to force an update, now add a third place
      triggerPopulate(secondPlace.name);
      // wait until data has been updated
      await waitUntil(
        () => element.places?.length > 1,
        'Map did not add to place data when adding individual places'
      );
      expect(element.shadowRoot.textContent).to.contain('Centre Pompidou');
      expect(element.shadowRoot.textContent).to.contain(secondPlace.name);
    });
  });
});
