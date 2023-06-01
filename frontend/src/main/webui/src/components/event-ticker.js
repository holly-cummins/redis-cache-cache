import { css, html } from 'lit';
import { BaseElement } from './base-element.js';
import { Discovery } from '../discovery/discovery.js';

class EventTicker extends BaseElement {

  static styles = [
    BaseElement.styles,
    css`
      .ticker {
        margin: 0.5rem;
        padding: 0.5rem;
        overflow: scroll;
        width: 450px;
        max-height: 250px;
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
        font-size: large;
      }

      .player {
        font-weight: bold;
        font-family: Handlee, fantasy;
      }

      .place {
      }
    `,
  ];

  render() {
    if (!this.events) {
      return html`
        <ul class="ticker">
          <li>Nothing happened yet...</li>
        </ul>
      `;
    }

    return html`
      <ul class="ticker">
        ${this.events.map(
          entry => html`
            <li>${EventTicker.format(entry)}</li> `
        )}
      </ul>
    `;
  }

  discovery = new Discovery();

  static get properties() {
    return {
      events: {},
    };
  }

  static format(event) {
    if (event.kind === 'PING') {
      return '';
    }
    const placeSpan = this.formatPlace(event.place);
    const hiderSpan = html`<span class="player">${event.hider}</span>`;

    switch (event.kind) {
      case 'HIDER':
        return html` Ooh, ${hiderSpan} is hidden in ${placeSpan}.`;
      case 'NEW_GAME':
        return html`Game started.`;
      case 'PLAYER_DISCOVERED': {
        return html`<span class="player">${event.seeker}</span> found
        <span class="player">${event.hider}</span> in ${placeSpan}.`;
      }
      case 'SEEKER_MOVE': {
        return html`<span class="player">${event.seeker}</span> went to
        ${this.formatPlace(event.destination)}.`;
      }
      case 'GAME_OVER': {
        const verb = event.seekerWon ? `won` : `lost`;
        return html`<b>Game over.</b> The seeker ${verb}!`;
      }

      default:
        return '';
    }
  }

  static formatPlace(place) {
    if (place) {
      return html`<span class="place">${place}</span>`;
    }
    return null;
  }

  connectedCallback() {
    super.connectedCallback();
    this.openConnection();
  }

  onServerUpdate = event => {
    if (!this.events) this.events = [];
    if (!this.events) this.events = [];
    const ev = JSON.parse(event?.data);
    if (!ev || ev.kind === 'PING') {
      console.log('ping!');
      return;
    }
    this.events.unshift(ev);
    // Unshift doesn't trigger a rerender, so force an update
    this.requestUpdate('events');

    // We should perhaps handle closing in a graceful way
  };

  async openConnection() {
    const location = await this.discovery.resolve('game', window.location.href)

    const eventSource = new EventSource(`${location}/games/events`);
    eventSource.onmessage = this.onServerUpdate;
    eventSource.onopen = () => {
      console.log('Connected to game events.');
    };
    eventSource.onerror = err => {
      console.warn('Error:', err);
    }

    // return the event source so we can wait
    return eventSource
  }
}

// Custom elements have to have a hyphen in the name, even in cases like this, where it doesn't really make sense
customElements.define('event-ticker', EventTicker);
