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
      element = await fixture(html` <event-ticker></event-ticker>`);
    });

    it('renders a list of events', async () => {
      await emitAndWait(firstEvent);
      const ul = element.shadowRoot.querySelector('ul');
      expect(ul).to.exist;
      const li = element.shadowRoot.querySelector('li');
      expect(li.textContent).to.contain(
        'first hider se cache au Centre Pompidou'
      );
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
      expect(li.textContent).to.contain(
        'second hider se cache au Eiffel Tower'
      );
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
      expect(li.textContent).to.contain('jeu commence');
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
      expect(li.textContent).to.contain('perdu');
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
      expect(li.textContent).to.contain('gagné');
    });

    it('renders player discovered events', async () => {
      await emitAndWait({
        gameId: '59e0557d-8c16-43cc-a63c-446b0a06bed5',
        hider: 'foundman',
        kind: 'PLAYER_DISCOVERED',
        place: 'Devoxx',
        seeker: 'super-cucumber',
      });

      const li = element.shadowRoot.querySelector('li');
      expect(li.textContent).to.contain('trouvé');
      expect(li.textContent).to.contain('foundman');
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
