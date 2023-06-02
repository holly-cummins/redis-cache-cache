import { css, html } from 'lit';
import { BaseElement } from './base-element.js';
import { Discovery } from '../discovery/discovery.js';

class Leaderboard extends BaseElement {
  static styles = [
    BaseElement.styles,
    css`
      .leaderboard {
        display: flex;
        flex-direction: column;
        padding: 0.5rem;
        margin: 0.5rem;
        width: 300px;
        border: 1px lightgray solid;
        border-radius: 5px;
        box-shadow: rgba(50, 50, 93, 0.25) 0 2px 5px -1px,
          rgba(0, 0, 0, 0.3) 0px 1px 3px -1px;
        background-color: white;
        opacity: 80%;
      }

      table {
      }

      h2 {
        padding: 0;
        margin: 0.3rem;
      }

      td {
        text-align: left;
        padding-bottom: 0.1rem;
      }

      .numeric {
        text-align: right;
      }
    `,
  ];

  discovery = new Discovery();

  render() {
    if (!this.data) {
      return html` <h2>Loading...</h2> `;
    }
    return html`
      <div class="leaderboard">
        <h2>Scoreboard</h2>
        <table>
          ${this.data.map(
            entry =>
              html` <tr>
                <td>${entry.value}</td>
                <td class="numeric">${entry.score}</td>
              </tr>`
          )}
        </table>
      </div>
    `;
  }

  static get properties() {
    return {
      data: {},
      eventSource: {},
    };
  }

  connectedCallback() {
    super.connectedCallback();
    this.fetchData();
    this.openConnection();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.closeConnection();
  }

  async fetchData() {
    try {
      const response = await this.discovery
        .resolve('leaderboard', window.location.href)
        .then(location => fetch(`${location}/leaderboard/`));
      this.data = await response?.json();
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('Could not fetch leaderboard information.');
    }
  }

  onServerUpdate = event => {
    // Leaving the log in so we can see how often events are coming in
    const d = JSON.parse(event?.data);
    if (d.length === 0) {
      // ping frame
      return;
    }
    this.data = d;
  };

  async openConnection() {
    // Server side events
    this.eventSource = await this.discovery
      .resolve('leaderboard', window.location.href)
      .then(location => new EventSource(`${location}/leaderboard/events`));

    this.eventSource.onmessage = this.onServerUpdate;
    this.eventSource.onopen = () => {
      // eslint-disable-next-line no-console
      console.log('Connected to leaderboard.');
    };
    this.eventSource.onerror = err => {
      // eslint-disable-next-line no-console
      console.warn('Error:', err);
    };
  }

  async closeConnection() {
    this.eventSource?.close();
  }
}

// Custom elements have to have a hyphen in the name, even in cases like this, where it doesn't really make sense
customElements.define('leader-board', Leaderboard);
