import { css, html, LitElement } from 'lit';
import './components/leader-board.js';
import './components/start-game-button.js';
import './components/add-place-button.js';
import './components/add-all-places-button.js';
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
      display: flex;
      flex-direction: column;
      flex-grow: 1;
      width: 100%;
    }

    .dashboard {
      display: flex;
      flex-direction: row;
      justify-content: space-between;
      align-items: flex-start;
    }

    .controls {
      display: flex;
      flex-direction: row;
      justify-content: space-around;
      flex-wrap: wrap-reverse;
      align-items: baseline;
      z-index: 5;
    }

    .monitors {
      z-index: 3;
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
        <div class="controls">
          <add-place-button></add-place-button>
          <add-all-places-button></add-all-places-button>
          <start-game-button></start-game-button>
        </div>
        <div class="dashboard">
          <div class="monitors">
            <leader-board></leader-board>
            <event-ticker></event-ticker>
          </div>
          <map-view></map-view>
        </div>
      </main>

      <p class="app-footer"></p>
    `;
  }
}

customElements.define('cache-cache-app', CacheCacheApp);
