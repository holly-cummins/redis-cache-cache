import { html } from 'lit';
import { expect, fixture, waitUntil } from '@open-wc/testing';
import sinon from 'sinon';
import '../../src/components/leader-board.js';
import { Discovery } from '../../src/discovery/discovery.js';

// the exact values here don't matter, something just needs to return
const eventSourceUrl = "http://irrelevant"

const mockApiResponse = (body = {}) =>
  Promise.resolve(
    new window.Response(JSON.stringify(body), {
      status: 200,
      headers: { 'Content-type': 'application/json' },
    })
  );

describe('Leaderboard', () => {
  let element;
  describe('in the absence of data', () => {
    beforeEach(async () => {
      sinon.stub(Discovery.prototype, 'resolve').resolves(eventSourceUrl);
      element = await fixture(html` <leader-board></leader-board>`);
      return element;
    });

    afterEach(async() => {
      sinon.restore()
    })

    it('renders a placeholder', () => {
      expect(element.shadowRoot.textContent).to.contain('Loading...');
    });

    it('passes the a11y audit', async () => {
      await expect(element).shadowDom.to.be.accessible();
    }).timeout(10000);
  });

  // Fixme June 1
  xdescribe('when data is available', () => {
    const body = [
      { value: 'fakeman', score: 2.0 },
      {
        value: 'super-cucumber',
        score: 1.0,
      },
      { value: 'raving rabbit', score: 1.0 },
    ];

    beforeEach(async () => {
      sinon.stub(Discovery.prototype, 'resolve').resolves(eventSourceUrl);
      const stubbedFetch = sinon.stub(window, 'fetch');
      stubbedFetch.returns(mockApiResponse(body));

      element = await fixture(html` <leader-board></leader-board>`);
      // wait until data has been set
      await waitUntil(() => element.data, 'Element did not populate its data');
    });

    afterEach(() => {
      window.fetch.restore(); // remove stub
      sinon.restore()
    });

    it('renders a table', () => {
      const table = element.shadowRoot.querySelector('table');
      expect(table).to.exist;
      expect(table.textContent).to.contain('super-cucumber');
      expect(table.textContent).to.contain('fakeman');
      expect(table.textContent).to.contain('1');
    });

    it('passes the a11y audit', async () => {
      await expect(element).shadowDom.to.be.accessible();
    }).timeout(10000);
  });

  describe('when updates are sent by server sent events', () => {
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
      sources[`${eventSourceUrl}/leaderboard/events`]?.onmessage({
        data: JSON.stringify(data),
      });
    };

    const body = [
      { value: 'dynamo-man', score: 2.0 },
      {
        value: 'speed-cucumber',
        score: 1.0,
      },
      { value: 'mad rabbit', score: 1.0 },
    ];

    beforeEach(async () => {
      sinon.stub(Discovery.prototype, 'resolve').resolves(eventSourceUrl);
      element = await fixture(html` <leader-board></leader-board>`);
      emit(body);

      // wait until data has been set
      await waitUntil(() => element.data, 'Leaderboard element did not populate its data');
    });

    afterEach(() => {
      sinon.restore()
    })

    it('renders a table', () => {
      const table = element.shadowRoot.querySelector('table');
      expect(table).to.exist;
      expect(table.textContent).to.contain('speed-cucumber');
      expect(table.textContent).to.contain('dynamo-man');
      expect(table.textContent).to.contain('1');
    });
  });
});
