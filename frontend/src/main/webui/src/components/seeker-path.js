import { css, html, svg } from 'lit';
import { BaseElement } from './base-element.js';

class SeekerPath extends BaseElement {
  static styles = [
    BaseElement.styles,
    // https://css-tricks.com/svg-line-animation-works/ has a good explanation
    css`
      .map {
        position: absolute;
        left: 0;
        z-index: 10;
      }

      .path {
        stroke-dasharray: 1000;
        stroke-dashoffset: 1000;
        animation: dashdraw 5s linear forwards;
      }

      @keyframes dashdraw {
        to {
          stroke-dashoffset: 0;
        }
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
      this.points?.map(entry => SeekerPath.plot(entry))}
    </svg>`;
  }

  static plot(point) {
    // Sometimes the points don't have a from and a to
    if (point?.from && point.to) {
      return svg`
      <path
        fill="none"
        stroke-width="3px"
        stroke="#D0D0D0"
        d="M${point.from[0]} ${point.from[1]}, ${point.to[0]} ${point.to[1]}"
      ></path>
      <circle
        r="10"
        cx="${point.to[0]}"
        cy="${point.to[1]}"
        fill="#BEBEBE"
      ></circle>
    `;
    }
    return svg``;
  }
}

customElements.define('seeker-path', SeekerPath);
