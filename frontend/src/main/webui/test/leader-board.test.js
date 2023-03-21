import { html } from 'lit';
import { expect, fixture, waitUntil } from '@open-wc/testing';
import sinon from 'sinon';
import '../src/components/leader-board.js';

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
      element = await fixture(html` <leader-board></leader-board>`);
    });

    it('renders a placeholder', () => {
      expect(element.shadowRoot.textContent).to.contain('Loading...');
    });

    it('passes the a11y audit', async () => {
      await expect(element).shadowDom.to.be.accessible();
    });
  });

  describe('when data is available', () => {
    const body = [
      { value: 'fakeman', score: 2.0 },
      {
        value: 'super-cucumber',
        score: 1.0,
      },
      { value: 'raving rabbit', score: 1.0 },
    ];

    beforeEach(async () => {
      const stubbedFetch = sinon.stub(window, 'fetch');
      stubbedFetch.returns(mockApiResponse(body));

      element = await fixture(html` <leader-board></leader-board>`);
      // wait until data has been set
      await waitUntil(() => element.data, 'Element did not populate its data');
    });

    afterEach(() => {
      window.fetch.restore(); // remove stub
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
    });
  });

  describe('when updates are sent by server sent events', () => {
    const sources = {};

    // There seems to be some es6/cjs issue with eventsourcemock, so home roll a mock
    class MockEventSource {
      constructor(url) {
        sources[url] = this;
      }
    }

    Object.defineProperty(window, 'EventSource', {
      writable: true,
      value: MockEventSource,
    });

    const emit = data => {
      sources['http://localhost:8093/leaderboard/events']?.onmessage({
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
      element = await fixture(html` <leader-board></leader-board>`);
      emit(body);

      // wait until data has been set
      await waitUntil(() => element.data, 'Element did not populate its data');
    });

    it('renders a table', () => {
      const table = element.shadowRoot.querySelector('table');
      expect(table).to.exist;
      expect(table.textContent).to.contain('speed-cucumber');
      expect(table.textContent).to.contain('dynamo-man');
      expect(table.textContent).to.contain('1');
    });
  });
});
