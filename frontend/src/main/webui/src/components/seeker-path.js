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

      .animated {
        stroke-dasharray: 1000;
        stroke-dashoffset: 1000;
        animation-iteration-count: 1;
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
      this.points?.map((entry, i) => SeekerPath.plot(entry, i === 0))}
    </svg>`;
    // isLast is checking the beginning of the array because they come in reverse order
  }

  static plot(point, isLast) {
    const animation = isLast
      ? `animation: dashdraw ${point.duration / 1000}s linear forwards;`
      : '';
    // Sometimes the points don't have a from and a to
    if (point?.from && point.to) {
      return svg`
      <path class=${isLast ? 'animated' : ''} style=${animation}
        fill="none"
        stroke-width="3px"
        stroke="#949494"
        d="M${point.from[0]} ${point.from[1]}, ${point.to[0]} ${point.to[1]}"
      ></path>
    `;
    }
    return svg``;
  }
}

customElements.define('seeker-path', SeekerPath);
