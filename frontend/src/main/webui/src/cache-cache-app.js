import { css, html, LitElement } from 'lit';
import './components/leader-board.js';
import './components/start-game-button.js';
import './components/event-ticker.js';

const logo = new URL('../assets/super-cucumber.png', import.meta.url).href;

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
      max-width: 960px;
      margin: 0 auto;
      text-align: center;
      background-color: var(--cache-cache-app-background-color);
    }

    main {
      flex-grow: 1;
    }

    .dashboard {
      display: flex;
      flex-direction: column;
    }

    .row {
      display: flex;
      flex-direction: row;
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
        <h1>C'est cache-cache!</h1>
        <start-game-button></start-game-button>
        <div class="dashboard">
          <div class="row">
            <div class="logo"><img alt="super-cucumber" src=${logo} /></div>
            <leader-board></leader-board>
          </div>
          <event-ticker></event-ticker>
        </div>
      </main>

      <p class="app-footer"></p>
    `;
  }
}

customElements.define('cache-cache-app', CacheCacheApp);
