import { css, html, svg } from 'lit';
import { BaseElement } from './base-element.js';

class Hiders extends BaseElement {
  static styles = [
    BaseElement.styles,
    css`
      .map {
        position: absolute;
        left: 0;
        z-index: 9;
      }

      circle {
        stroke-width: 2;
      }
    `,
  ];

  static get properties() {
    // The count is here to force a re-render when array contents change
    return { points: { type: Array }, count: {}, width: {}, height: {} };
  }

  render() {
    return html` <svg
      class="map"
      viewbox="0 0 ${this.width} ${this.height}"
      height="${this.height}px"
      width="${this.width}px"
    >
      ${Array.isArray(this.points) &&
      this.points?.map(entry => Hiders.plot(entry))}
    </svg>`;
  }

  static plot({ coords, discovered }) {
    if (coords) {
      const stroke = discovered ? '#EE0000' : '#BEBEBE';
      return svg`
      <circle
        r="10"
        cx="${coords[0]}"
        cy="${coords[1]}"
        fill="#BEBEBE"
        stroke="${stroke}"
      ></circle>
    `;
    }
    return svg``;
  }
}

customElements.define('hidey-holes', Hiders);
