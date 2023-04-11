import { css, html } from 'lit';
import { BaseElement } from './base-element.js';

// This value needs to be hand-tuned
const imageMinLatitude = 48.81;
const imageMaxLatitude = 48.91;

const imageMinLongitude = 2.22;
const imageMaxLongitude = 2.45;

const rawImageHeightInDegrees = imageMaxLatitude - imageMinLatitude;
const rawImageWidthInDegrees = imageMaxLongitude - imageMinLongitude;

const defaultRange = 0.01;

export class MapImage extends BaseElement {
  static styles = [
    BaseElement.styles,
    css`
      .backgroundmap {
        position: relative;
        overflow: hidden;
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
      heightInDegrees: {},
      widthInDegrees: {},
      minLatitude: {},
      minLongitude: {},
      // A bit of a hack because we don't pass across zero-width properties
      isSinglePoint: {},
    };
  }

  render() {
    // The attribute comes in as a string, so we need to convert to a boolean
    const isSinglePoint = this.isSinglePoint?.toLowerCase() === 'true';

    const noYRange =
      !this.heightInDegrees || +this.heightInDegrees === 0 || isSinglePoint;

    const noXRange =
      !this.widthInDegrees || +this.widthInDegrees === 0 || isSinglePoint;

    if (noYRange) {
      this.heightInDegrees = defaultRange;
      this.minLatitude -= defaultRange / 2;
    }
    if (noXRange) {
      this.widthInDegrees = defaultRange;
      this.minLongitude -= defaultRange / 2;
    }

    const imageHeight =
      this.height * (rawImageHeightInDegrees / this.heightInDegrees);
    const imageWidth =
      this.width * (rawImageWidthInDegrees / this.widthInDegrees);

    // With the current arrangement of relative and absolute, the image
    // appears in the middle of the canvas
    const cssAdjuster = 50;
    const xOffset =
      -1 *
        ((imageMinLongitude - this.minLongitude) / rawImageWidthInDegrees) *
        100 -
      cssAdjuster;
    const yOffset =
      ((imageMinLatitude - this.minLatitude) / rawImageHeightInDegrees) * 100 +
      50;

    return html` <div
      class="backgroundmap"
      style="width: ${this.width}px;
        height: ${this.height}px;
"
    >
      <img
        style="
        width: ${imageWidth}px;
        height: ${imageHeight}px;
        transform: translate(${Math.round(xOffset)}%, ${Math.round(yOffset)}%)"
        src="assets/paris-map.png"
        alt="hand drawn map of Paris"
      />
    </div>`;
  }
}

customElements.define('map-image', MapImage);
