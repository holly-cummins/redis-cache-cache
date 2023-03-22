import { css, html, LitElement } from 'lit';

class EventTicker extends LitElement {
  static styles = css`
    ul {
      display: flex;
      flex-direction: column;
      list-style-type: none;
    }

    li {
      text-align: left;
      font-family: Courier, monospace;
      font-size: 1.5rem;
    }
  `;

  render() {
    if (!this.events) {
      return html` <h2>Rien n'est encore arrivé ...</h2> `;
    }

    return html`
      <ul>
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
        return html`Oh, ${event.hider} se cache au ${event.place}.`;
      case 'NEW_GAME':
        return html`Le jeu commence.`;
      case 'GAME_OVER':
        return event.seekerWon
          ? html`L'attrapeur a gagné.`
          : html`L'attrapeur a perdu.`;
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
