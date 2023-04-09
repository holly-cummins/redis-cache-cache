import { css, html } from 'lit';
import { BaseElement } from './base-element.js';

// This value needs to be hand-tuned
const imageMinLatitude = 48.785;
const imageMaxLatitude = 48.93;

const imageMinLongitude = 2.24;
const imageMaxLongitude = 2.5;

const rawImageHeight = 1668;
const rawImageWidth = 2224;

const rawImageHeightInDegrees = imageMaxLatitude - imageMinLatitude;
const rawImageWidthInDegrees = imageMaxLongitude - imageMinLongitude;

const pixelsPerDegreesH =
  rawImageHeight / (imageMaxLatitude - imageMinLatitude);
const pixelsPerDegreesW =
  rawImageWidth / (imageMaxLongitude - imageMinLongitude);

// The two scale factors should be identical, but in case they're not, round to smudge out errors
const pixelsPerDegrees = (pixelsPerDegreesH + pixelsPerDegreesW) / 2;

console.log(pixelsPerDegreesW);
console.log('he', pixelsPerDegreesH);

export class MapImage extends BaseElement {
  static styles = [
    BaseElement.styles,
    css`
      .backgroundmap {
        position: absolute;
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
    };
  }

  render() {
    console.log('heights in degrees,', this.heightInDegrees);
    console.log('widths in degrees,', this.widthInDegrees);

    console.log('raw heights in degrees,', rawImageHeightInDegrees);
    console.log('raw widths in degrees,', rawImageWidthInDegrees);

    const imageHeight =
      this.height * (rawImageHeightInDegrees / this.heightInDegrees);
    const imageWidth =
      this.width * (rawImageWidthInDegrees / this.widthInDegrees);

    console.log('so made height', imageHeight);
    console.log('so made width', imageWidth);

    console.log('image min lat', imageMinLatitude);
    console.log('points min lat', this.minLatitude);
    console.log('image min long', imageMinLongitude);
    console.log('points min long', this.minLongitude);
    console.log('multiplier is ', pixelsPerDegrees);
    const xoffset =
      -1 *
      (imageMinLongitude - this.minLongitude) *
      (this.width / this.widthInDegrees);
    const yoffset =
      -1 *
      (imageMinLatitude - this.minLatitude) *
      (this.height / this.heightInDegrees);

    console.log('x off', xoffset);
    console.log('y odd', yoffset);

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
        transform: translate(${xoffset}px, ${yoffset}px)"
        src="assets/paris-map.png"
        alt="hand drawn map of Paris"
      />
    </div>`;
  }
}

customElements.define('map-image', MapImage);
