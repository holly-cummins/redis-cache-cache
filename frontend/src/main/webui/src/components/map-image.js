import { css, html } from 'lit';
import { BaseElement } from './base-element.js';

export const imageMinLatitude = 30;
export const imageMaxLatitude = 70;

export const imageMinLongitude = -20;
export const imageMaxLongitude = 30;

export class MapImage extends BaseElement {
  static styles = [
    BaseElement.styles,
    css`
      .backgroundmap {
        position: relative;
        margin: 0;
        padding: 0;
      }

      img {
        position: absolute;
        margin: 0;
        padding: 0;
      }
    `,
  ];

  static get properties() {
    return {
      height: {},
      width: {},
      converter: {},
    };
  }

  render() {
    // With the current arrangement of relative and absolute, the image
    // appears in the middle of the canvas
    const cssAdjuster = this.converter.width / 2;

    // Remember that redis coordinates swap long and lat
    // Remember also that the y coordinates increase in thje opposite direction
    const transformedCorner = this.converter.convert({
      coordinates: `${imageMaxLongitude},${imageMinLatitude}`,
    });
    const transformedOtherCorner = this.converter.convert({
      coordinates: `${imageMinLongitude},${imageMaxLatitude}`,
    });

    const transformedWidth = Math.round(
      transformedCorner[0] - transformedOtherCorner[0]
    );
    const transformedHeight = Math.round(
      transformedCorner[1] - transformedOtherCorner[1]
    );
    const xOffset = Math.round(transformedOtherCorner[0]) - cssAdjuster;
    const yOffset = Math.round(transformedOtherCorner[1]);

    return html` <div
      class="backgroundmap"
      style="width: ${this.width}px;
        height: ${this.height}px;
"
    >
      <img
        style="
        width: ${transformedWidth}px;
        height: ${transformedHeight}px;
        transform: translate(${xOffset}px, ${yOffset}px)"
        src="assets/map.png"
        alt="hand drawn map of Europe"
      />
    </div>`;
  }
}

customElements.define('map-image', MapImage);
