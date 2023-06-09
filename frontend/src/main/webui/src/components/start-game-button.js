import { css, html } from 'lit';
import { BaseElement } from './base-element.js';
import { Discovery } from '../discovery/discovery.js';

class StartGameButton extends BaseElement {
  static styles = [
    BaseElement.styles,
    css`
      button {
        margin: 2rem;
        width: 500px;
        background-color: #4e7b9e;
        border: 1px solid #4e7b9e;
        border-radius: 4px;
        box-shadow: rgba(0, 0, 0, 0.1) 0 2px 4px 0;
        box-sizing: border-box;
        color: #fff;
        cursor: pointer;
        font-size: 16px;
        font-weight: 600;
        outline: none;
        outline: 0;
        padding: 10px 25px;
        text-align: center;
        transform: translateY(0);
        transition: transform 150ms, box-shadow 150ms;
        user-select: none;
        -webkit-user-select: none;
        touch-action: manipulation;
        z-index: 8;
      }

      button:hover {
        box-shadow: rgba(0, 0, 0, 0.15) 0 3px 9px 0;
        transform: translateY(-2px);
      }

      @media (min-width: 768px) {
        button {
          padding: 10px 30px;
        }
      }
    `,
  ];

  discovery = new Discovery();

  render() {
    return html` <button @click="${this.fetchData}">Start game</button> `;
  }

  async fetchData() {
    const location = await this.discovery.resolve('game', window.location.href);

    return fetch(`${location}/games`, {
      method: 'POST',
    });
  }
}

// Custom elements have to have a hyphen in the name, even in cases like this, where it doesn't really make sense
customElements.define('start-game-button', StartGameButton);
