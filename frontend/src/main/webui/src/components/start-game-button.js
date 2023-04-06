import { css, html } from 'lit';
import { BaseElement } from './base-element.js';

const fetchData = async () => {
  await fetch('http://localhost:8091/games', {
    method: 'POST',
  });
};

class StartGameButton extends BaseElement {
  static styles = [
    BaseElement.styles,
    css`
      button {
        margin: 2rem;
        width: 500px;
        background-color: #177831;
        border: 1px solid #177831;
        border-radius: 4px;
        box-shadow: rgba(0, 0, 0, 0.1) 0 2px 4px 0;
        box-sizing: border-box;
        color: #fff;
        cursor: pointer;
        font-size: 14px;
        font-weight: 500;
        outline: none;
        outline: 0;
        padding: 10px 25px;
        text-align: center;
        transform: translateY(0);
        transition: transform 150ms, box-shadow 150ms;
        user-select: none;
        -webkit-user-select: none;
        touch-action: manipulation;
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

  render() {
    return html`
      <button @click="${fetchData}">Démarrer un jeu de cache-cache</button>
    `;
  }
}

// Custom elements have to have a hyphen in the name, even in cases like this, where it doesn't really make sense
customElements.define('start-game-button', StartGameButton);
