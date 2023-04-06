import { css, html, LitElement } from 'lit';
import './components/leader-board.js';
import './components/start-game-button.js';
import './components/event-ticker.js';
import './components/map-view.js';

class CacheCacheApp extends LitElement {
  static styles = css`
    :host {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: flex-start;
      font-size: calc(10px + 2vmin);
      color: #1a2b42;
      margin: 0 auto;
      text-align: center;
      background-color: var(--cache-cache-app-background-color);
    }

    main {
      flex-grow: 1;
      width: 100%;
    }

    .dashboard {
      display: flex;
      flex-direction: column;
    }

    .row {
      display: flex;
      flex-direction: row;
      justify-content: space-between;
    }

    .logo {
      margin-top: 36px;
      animation: app-logo-spin infinite 20s linear;
    }

    @keyframes app-logo-spin {
      from {
        transform: rotate(0deg);
      }
      to {
        transform: rotate(360deg);
      }
    }

    .app-footer {
      font-size: calc(12px + 0.5vmin);
      align-items: center;
    }

    .app-footer a {
      margin-left: 5px;
    }
  `;

  constructor() {
    super();
    this.header = 'My app';
  }

  render() {
    return html`
      <main>
        <start-game-button></start-game-button>
        <div class="dashboard">
          <div class="row">
            <event-ticker></event-ticker>
            <map-view></map-view>
            <leader-board></leader-board>
          </div>
        </div>
      </main>

      <p class="app-footer"></p>
    `;
  }
}

customElements.define('cache-cache-app', CacheCacheApp);
