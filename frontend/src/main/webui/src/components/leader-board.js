import { css, html, LitElement } from 'lit';

class Leaderboard extends LitElement {
  static styles = css`
    .leaderboard {
      display: flex;
      flex-direction: column;
      width: 500px; // Slightly clunky hardcoding to avoid this element being squished
    }

    table {
    }

    td {
      text-align: left;
      padding-bottom: 1.25rem;
    }

    .numeric {
      text-align: right;
    }
  `;

  render() {
    if (!this.data) {
      return html` <h2>Loading...</h2> `;
    }
    return html`
      <div class="leaderboard">
        <h2>Les scores<br />(jusqu'à présent)</h2>
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
      const response = await fetch('http://localhost:8093/leaderboard/');
      this.data = await response?.json();
    } catch (e) {
      console.warn('Could not fetch leaderboard information.');
    }
  }

  onServerUpdate = event => {
    // Leaving the log in so we can see how often events are coming in
    console.debug('Updating data:', event);
    this.data = JSON.parse(event?.data);
  };

  async openConnection() {
    // Server side events
    this.eventSource = new EventSource(
      'http://localhost:8093/leaderboard/events'
    );
    this.eventSource.onmessage = this.onServerUpdate;
    this.eventSource.onopen = function () {
      console.log('Connected to leaderboard.');
    };
    this.eventSource.onerror = function (err) {
      console.warn('Error:', err);
    };
  }

  async closeConnection() {
    this.eventSource?.close();
  }
}

// Custom elements have to have a hyphen in the name, even in cases like this, where it doesn't really make sense
customElements.define('leader-board', Leaderboard);
