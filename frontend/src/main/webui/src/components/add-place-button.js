import { css, html } from 'lit';
import { BaseElement } from './base-element.js';
import { AddAllPlacesButton } from './add-all-places-button.js';

class AddPlaceButton extends BaseElement {
  static styles = [
    AddAllPlacesButton.styles,
    css`
      div {
        display: flex;
        align-items: center;
        padding-left: 1rem;
        padding-right: 1rem;
      }

      input {
        width: 250px;
        height: 1.5rem;
        z-index: 6;
        padding: 5px;
      }
    `,
  ];

  constructor() {
    super();
    this.place = '';
  }

  onInputChange = e => {
    this.place = e.target.value;
  };

  static get properties() {
    return {
      place: {},
    };
  }

  render() {
    return html`
      <div>
        <input
          type="text"
          placeholder="Lieu"
          .value="${this.place}"
          @change="${this.onInputChange}"
        />
        <button
          @click="${() => {
            window.dispatchEvent(
              new CustomEvent('add-place', {
                composed: true,
                bubbles: true,
                detail: { place: this.place },
              })
            );
          }}"
        >
          Ajouter un lieu
        </button>
      </div>
      </div>
    `;
  }
}

// Custom elements have to have a hyphen in the name, even in cases like this, where it doesn't really make sense
customElements.define('add-place-button', AddPlaceButton);
