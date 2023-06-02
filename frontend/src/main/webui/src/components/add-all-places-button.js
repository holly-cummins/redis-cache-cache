import { css, html } from 'lit';
import { BaseElement } from './base-element.js';

export class AddAllPlacesButton extends BaseElement {
  static styles = [
    BaseElement.styles,
    css`
      button {
        margin: 1rem;
        width: 250px;
        background-color: #b2d3ed;
        border: 1px solid #b2d3ed;
        border-radius: 4px;
        box-shadow: rgba(0, 0, 0, 0.1) 0 2px 4px 0;
        box-sizing: border-box;
        color: black;
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

  render() {
    return html`
      <button
        @click="${() => {
          window.dispatchEvent(
            new CustomEvent('add-all-places', { composed: true, bubbles: true })
          );
        }}"
      >
        Add all places
      </button>
    `;
  }
}

// Custom elements have to have a hyphen in the name, even in cases like this, where it doesn't really make sense
customElements.define('add-all-places-button', AddAllPlacesButton);
