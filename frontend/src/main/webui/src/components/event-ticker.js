import { css, html } from 'lit';
import { BaseElement } from './base-element.js';
import { prependAt } from '../language/grammar-helper.js';

class EventTicker extends BaseElement {
  static styles = [
    BaseElement.styles,
    css`
      .ticker {
        margin: 0.5rem;
        padding: 0.5rem;
        overflow: scroll;
        width: 350px;
        max-height: 150px;
        position: absolute;
        z-index: 2;
        border: 1px lightgray solid;
        border-radius: 5px;
        box-shadow: rgba(50, 50, 93, 0.25) 0 2px 5px -1px,
          rgba(0, 0, 0, 0.3) 0px 1px 3px -1px;
      }

      ul {
        display: flex;
        flex-direction: column;
        list-style-type: none;
      }

      li {
        text-align: left;
        font-family: Courier, monospace;
        font-size: 14px;
      }
    `,
  ];

  render() {
    if (!this.events) {
      return html`
        <ul class="ticker">
          <li>Rien n'est encore arrivé ...</li>
        </ul>
      `;
    }

    return html`
      <ul class="ticker">
        ${this.events.map(
          entry => html` <li>${EventTicker.format(entry)}</li> `
        )}
      </ul>
    `;
  }

  static get properties() {
    return {
      events: {},
    };
  }

  static format(event) {
    switch (event.kind) {
      case 'HIDER':
        return html`Oh, ${event.hider} se cache ${prependAt(event)}.`;
      case 'NEW_GAME':
        return html`Le jeu commence.`;
      case 'PLAYER_DISCOVERED': {
        return html`Ah, ${event.seeker} a trouvé ${event.hider} a
        ${event.place}.`;
      }
      case 'SEEKER_MOVE': {
        return html`Ah, ${event.seeker} est allé a ${event.destination}.`;
      }
      case 'GAME_OVER': {
        const verb = event.seekerWon ? `a gagné` : `a perdu`;
        return html`<b>Jeu terminé.</b> L'attrapeur ${verb}!`;
      }

      default:
        return '';
    }
  }

  connectedCallback() {
    super.connectedCallback();
    this.openConnection();
  }

  onServerUpdate = event => {
    console.debug('Updating events:', event);
    if (!this.events) this.events = [];
    this.events.unshift(JSON.parse(event?.data));
    // Unshift doesn't trigger a rerender, so force an update
    this.requestUpdate('events');

    // We should perhaps handle closing in a graceful way
  };

  async openConnection() {
    // Server side events
    const eventSource = new EventSource('http://localhost:8091/games/events');
    eventSource.onmessage = this.onServerUpdate;
    eventSource.onopen = () => {
      console.log('Connected to game events.');
    };
    eventSource.onerror = err => {
      console.warn('Error:', err);
    };
  }
}

// Custom elements have to have a hyphen in the name, even in cases like this, where it doesn't really make sense
customElements.define('event-ticker', EventTicker);
