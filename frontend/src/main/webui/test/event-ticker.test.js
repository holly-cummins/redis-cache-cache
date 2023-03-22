import { html } from 'lit';
import { expect, fixture, waitUntil } from '@open-wc/testing';
import '../src/components/event-ticker.js';

describe('Event ticker', () => {
  let element;
  describe('in the absence of data', () => {
    beforeEach(async () => {
      element = await fixture(html` <event-ticker></event-ticker>`);
    });

    it('renders a placeholder', () => {
      expect(element.shadowRoot.textContent).to.contain(
        "Rien n'est encore arrivé ..."
      );
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
      sources['http://localhost:8091/games/events']?.onmessage({
        data: JSON.stringify(data),
      });
    };

    const firstEvent = {
      kind: 'HIDER',
      gameId: 'b5415c47-5923-4828-8f89-483a217be2fa',
      hider: 'first hider',
      place: 'Centre Pompidou',
    };

    beforeEach(async () => {
      element = await fixture(html` <event-ticker></event-ticker>`);
      emit(firstEvent);

      // wait until data has been set
      await waitUntil(
        () => element.events,
        'Element did not populate its data'
      );
    });

    it('renders a list of events', () => {
      const ul = element.shadowRoot.querySelector('ul');
      expect(ul).to.exist;
      const li = element.shadowRoot.querySelector('li');
      expect(li.textContent).to.contain(
        'first hider se cache au Centre Pompidou'
      );
    });

    it('prepends subsequent events', async () => {
      emit({
        kind: 'HIDER',
        gameId: 'b5415c47-5923-4828-8f89-483a217be2fa',
        hider: 'second hider',
        place: 'Eiffel Tower',
      });
      // wait until data has been set
      await waitUntil(
        () => element.events,
        'Element did not populate its data'
      );
      const ul = element.shadowRoot.querySelector('ul');
      expect(ul).to.exist;
      // The selector will select the first matching item, which in this case is what we want, because we want descending order
      const li = element.shadowRoot.querySelector('li');
      expect(li.textContent).to.contain(
        'second hider se cache au Eiffel Tower'
      );
    });

    it('passes the a11y audit', async () => {
      await expect(element).shadowDom.to.be.accessible();
    });
  });
});
