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
      ${Array.isArray(this.discoveries) &&
      this.discoveries?.map(entry => Hiders.plotDiscovery(entry))}
    </svg>`;
  }

  static plot(point) {
    if (point) {
      return svg`
      <circle
        r="10"
        cx="${point[0]}"
        cy="${point[1]}"
        fill="#BEBEBE"
      ></circle>
    `;
    }
    return svg``;
  }

  static plotDiscovery(point) {
    if (point) {
      return svg`
      <circle
        r="10"
        cx="${point[0]}"
        cy="${point[1]}"
        stroke="#EE0000"
        fill="#BEBEBE"
      ></circle>
    `;
    }
    return svg``;
  }
}

customElements.define('hidey-holes', Hiders);
