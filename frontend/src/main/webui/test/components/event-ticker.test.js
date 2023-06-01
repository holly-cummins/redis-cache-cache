import { html } from 'lit';
import { expect, fixture, waitUntil } from '@open-wc/testing';
import sinon from "sinon";
import '../../src/components/event-ticker.js';
import { Discovery } from '../../src/discovery/discovery.js';

// the exact values here don't matter, something just needs to return
const eventSourceUrl = "http://irrelevant"

describe('Event ticker', () => {
  let element;
  describe('in the absence of data', () => {
    beforeEach(async () => {
      sinon.stub(Discovery.prototype, 'resolve').resolves(eventSourceUrl);
      element = await fixture(html` <event-ticker></event-ticker>`);
      return element;
    });

    afterEach(async () => {
      sinon.restore();
    })

    it('renders a placeholder', () => {
      expect(element.shadowRoot.textContent).to.contain('Nothing happened yet');
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
    }

    Object.defineProperty(window, 'EventSource', {
      writable: true,
      value: MockEventSource,
    });

    const emit = data => {
      sources[`${eventSourceUrl}/games/events`]?.onmessage({
        data: JSON.stringify(data),
      });
    };

    const emitAndWait = async data => {
      emit(data);

      // wait until data has been set
      await waitUntil(
        () => element.events,
        'Element did not populate its data'
      );
    };

    const firstEvent = {
      kind: 'HIDER',
      gameId: 'b5415c47-5923-4828-8f89-483a217be2fa',
      hider: 'first hider',
      place: 'Centre Pompidou',
    };

    beforeEach(async () => {
      sinon.stub(Discovery.prototype, 'resolve').resolves(eventSourceUrl);
      element = await fixture(html` <event-ticker></event-ticker>`);
    });

    afterEach(() => {
      sinon.restore();
    })

    it('renders a list of events', async () => {
      await emitAndWait(firstEvent);
      const ul = element.shadowRoot.querySelector('ul');
      expect(ul).to.exist;
      const li = element.shadowRoot.querySelector('li');
      expect(li.textContent).to.contain('first hider is hidden in Centre Pompidou');
    });

    it('prepends subsequent events', async () => {
      await emitAndWait(firstEvent);
      await emitAndWait({
        kind: 'HIDER',
        gameId: 'b5415c47-5923-4828-8f89-483a217be2fa',
        hider: 'second hider',
        place: 'Eiffel Tower',
      });

      const ul = element.shadowRoot.querySelector('ul');
      expect(ul).to.exist;
      // The selector will select the first matching item, which in this case is what we want, because we want descending order
      const li = element.shadowRoot.querySelector('li');
      expect(li.textContent).to.contain('second hider is hidden in Eiffel Tower');
    });

    it('renders game start events', async () => {
      await emitAndWait({
        gameId: '59e0557d-8c16-43cc-a63c-446b0a06bed5',
        hiders: {
          frogman: 'Devoxx',
          'raving rabbit': 'Montmartre',
        },
        kind: 'NEW_GAME',
        seeker: 'super-cucumber',
      });
      const li = element.shadowRoot.querySelector('li');
      expect(li.textContent).to.contain('started');
    });

    it('renders game end events when the seeker lost', async () => {
      await emitAndWait({
        duration: 837,
        gameId: '59e0557d-8c16-43cc-a63c-446b0a06bed5',
        hiders: {
          frogman: 'Devoxx',
          'raving rabbit': 'Montmartre',
        },
        kind: 'GAME_OVER',
        nonDiscoveredPlayers: 1,
        seeker: 'super-cucumber',
        seekerWon: false,
      });

      const li = element.shadowRoot.querySelector('li');
      expect(li.textContent).to.contain('lost');
    });

    it('renders game end events when the seeker won', async () => {
      await emitAndWait({
        duration: 837,
        gameId: '59e0557d-8c16-43cc-a63c-446b0a06bed5',
        hiders: {
          frogman: 'Devoxx',
          'raving rabbit': 'Montmartre',
        },
        kind: 'GAME_OVER',
        nonDiscoveredPlayers: 0,
        seeker: 'super-cucumber',
        seekerWon: true,
      });

      const li = element.shadowRoot.querySelector('li');
      expect(li.textContent).to.contain('won');
    });

    it('renders player discovered events', async () => {
      await emitAndWait({
        gameId: '59e0557d-8c16-43cc-a63c-446b0a06bed5',
        hider: 'soughtman',
        kind: 'PLAYER_DISCOVERED',
        place: 'Devoxx',
        seeker: 'super-cucumber',
      });

      const li = element.shadowRoot.querySelector('li');
      expect(li.textContent).to.contain('found');
      expect(li.textContent).to.contain('soughtman');
    });

    it('renders seeker move events', async () => {
      await emitAndWait({
        destination: 'Sacré Coeur',
        distance: 1029.3517,
        duration: 34,
        gameId: '59e0557d-8c16-43cc-a63c-446b0a06bed5',
        kind: 'SEEKER_MOVE',
        place: 'Devoxx',
        seeker: 'fakeman',
      });

      const li = element.shadowRoot.querySelector('li');
      expect(li.textContent).to.contain('fakeman');
      expect(li.textContent).to.contain('Sacré Coeur');
    });
  });
});
