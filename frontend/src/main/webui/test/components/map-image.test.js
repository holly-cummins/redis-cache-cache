import { html } from 'lit';
import { expect, fixture } from '@open-wc/testing';

import {
  imageMaxLatitude,
  imageMaxLongitude,
  imageMinLatitude,
  imageMinLongitude,
} from '../../src/components/map-image.js';
import { CoordinateConverter } from '../../src/geometry/cooordinate-converter.js';

const originalImageHeightInDegrees = imageMaxLatitude - imageMinLatitude;
const originalImageWidthInDegrees = imageMaxLongitude - imageMinLongitude;

const frameHeight = 1668;
const frameWidth = 2224;
const frameAspectRatio = frameHeight / frameWidth;

function getDimensions(element) {
  const img = element.shadowRoot.querySelector('img');
  expect(img).to.exist;
  const style = img.getAttribute('style');
  expect(style).to.contain('width');
  expect(style).not.to.contain('Infinity');
  expect(style).not.to.contain('NaN');
  const widthPattern = /width: ?([0-9.]+)px/m;
  expect(style).to.match(widthPattern);
  const widthMatch = style.match(widthPattern);
  const width = +widthMatch[1];
  const heightPattern = /height: ?([0-9.]+)px/m;
  expect(style).to.match(heightPattern);
  const heightMatch = style.match(heightPattern);
  const height = +heightMatch[1];
  return { width, height };
}

function getTranslateTransform(element) {
  const img = element.shadowRoot.querySelector('img');
  expect(img).to.exist;
  const style = img.getAttribute('style');
  expect(style).to.contain('width');
  expect(style).not.to.contain('Infinity');
  expect(style).not.to.contain('NaN');
  const matcher = /translate\((-?[0-9.]+)px, ?(-?[0-9.]+)px\)/m;
  expect(style).to.match(matcher);
  const transformMatch = style.match(matcher);
  const x = +transformMatch[1];
  const y = +transformMatch[2];
  return { x, y };
}

const getCoordinateConverter = ({
  minLatitude,
  minLongitude,
  heightInDegrees,
  widthInDegrees,
}) => {
  // Remember redis does lat, long
  const places = [
    {
      coordinates: `${minLatitude},${minLongitude}`,
    },
    {
      coordinates: `${minLatitude + heightInDegrees},${
        minLongitude + widthInDegrees
      }`,
    },
  ];
  return new CoordinateConverter({
    places,
    height: frameHeight,
    width: frameWidth,
  });
};

describe('Map image', () => {
  let element;

  describe('when the map fits exactly into the frame', () => {
    beforeEach(async () => {
      const coordinateConverter = getCoordinateConverter({
        heightInDegrees: originalImageHeightInDegrees,
        widthInDegrees: originalImageWidthInDegrees,
        minLatitude: imageMinLatitude,
        minLongitude: imageMinLongitude,
      });
      element = await fixture(html` <map-image
        .converter="${coordinateConverter}"
        height="${frameHeight}"
        width="${frameWidth}"
      ></map-image>`);
    });

    it('renders a div', () => {
      const el = element.shadowRoot.querySelector('div');
      expect(el).to.exist;
    });

    it('renders an img', () => {
      const el = element.shadowRoot.querySelector('img');
      expect(el).to.exist;
    });

    xit('assigns a sensible scale to the map', () => {
      const img = element.shadowRoot.querySelector('img');
      expect(img).to.exist;

      const style = img.getAttribute('style');
      expect(style).to.contain(`width: ${frameWidth}px`);
      expect(style).to.contain(`height: ${frameHeight}px`);
    });

    xit('does not adjust the position of the map', () => {
      const img = element.shadowRoot.querySelector('img');
      expect(img).to.exist;

      const { x, y } = getTranslateTransform(element);
      // We actually do need to shift the image to centre it
      expect(Math.round(x)).to.equal((-1 * frameWidth) / 2);
      expect(Math.round(y)).to.equal(0);
    });

    it('assigns the right size to the container', () => {
      const div = element.shadowRoot.querySelector('div');
      expect(div).to.exist;
      const style = div.getAttribute('style');
      expect(style).to.contain(`width: ${frameWidth}px`);
      expect(style).to.contain(`height: ${frameHeight}px`);
    });

    it('passes the a11y audit', async () => {
      await expect(element).shadowDom.to.be.accessible();
    }).timeout(10000);
  });

  describe('when the map should only cover half the canvas, snuggled up in the top corner', () => {
    beforeEach(async () => {
      const coordinateConverter = getCoordinateConverter({
        heightInDegrees: originalImageHeightInDegrees * 2,
        widthInDegrees: originalImageWidthInDegrees * 2,
        minLatitude: imageMinLatitude,
        minLongitude: imageMinLongitude,
      });
      element = await fixture(html` <map-image
        .converter="${coordinateConverter}"
        height="${frameHeight}"
        width="${frameWidth}"
      ></map-image>`);
    });

    xit('assigns a sensible scale to the map', () => {
      const img = element.shadowRoot.querySelector('img');
      expect(img).to.exist;

      const style = img.getAttribute('style');
      expect(style).to.contain(`width: ${frameWidth / 2}px`);
      expect(style).to.contain(`height: ${frameHeight / 2}px`);
    });

    xit('does not adjust the position of the map', () => {
      const img = element.shadowRoot.querySelector('img');
      expect(img).to.exist;

      // If the minimums are the same, the map should be in the bottom left corner
      const { x, y } = getTranslateTransform(element);
      const { width } = getDimensions(element);
      // We actually do need to shift the image to centre it
      expect(Math.round(x)).to.equal(-1 * width);
      expect(Math.round(y)).to.equal(0);
    });

    it('assigns the right size to the container', () => {
      const div = element.shadowRoot.querySelector('div');
      expect(div).to.exist;
      const style = div.getAttribute('style');
      expect(style).to.contain(`width: ${frameWidth}px`);
      expect(style).to.contain(`height: ${frameHeight}px`);
    });
  });

  describe('when the map should only cover half the canvas, exactly centred', () => {
    beforeEach(async () => {
      const coordinateConverter = getCoordinateConverter({
        heightInDegrees: originalImageHeightInDegrees * 2,
        widthInDegrees: originalImageWidthInDegrees * 2,
        minLatitude: imageMinLatitude / 4,
        minLongitude: imageMinLongitude / 4,
      });
      element = await fixture(html` <map-image
        .converter="${coordinateConverter}"
        height="${frameHeight}"
        width="${frameWidth}"
      ></map-image>`);
    });

    xit('assigns a sensible scale to the map', () => {
      const img = element.shadowRoot.querySelector('img');
      expect(img).to.exist;

      const style = img.getAttribute('style');
      // The width is adjusted for the aspect ratio
      // TODO why are height and width switched?!
      expect(style).to.contain(
        `width: ${(frameWidth / 2) * frameAspectRatio}px`
      );
      expect(style).to.contain(`height: ${frameHeight / 2}px`);
    });

    xit('adjusts the x position of the map by a quarter', () => {
      // If the minimums are the same, the map should be in the bottom left corner
      const { x } = getTranslateTransform(element);
      // We actually do need to shift the image to centre it
      expect(Math.round(x)).to.equal((-1 * frameWidth) / 4);
    });

    xit('adjusts the y position of the map by a quarter', () => {
      // If the minimums are the same, the map should be in the bottom left corner
      const { y } = getTranslateTransform(element);
      // We actually do need to shift the image to centre it
      expect(Math.round(y)).to.equal(frameHeight / 4);
    });

    it('assigns the right size to the container', () => {
      const div = element.shadowRoot.querySelector('div');
      expect(div).to.exist;
      const style = div.getAttribute('style');
      expect(style).to.contain(`width: ${frameWidth}px`);
      expect(style).to.contain(`height: ${frameHeight}px`);
    });
  });

  describe('when the map should only cover half the canvas, snuggled up in the top corner', () => {
    beforeEach(async () => {
      const coordinateConverter = getCoordinateConverter({
        heightInDegrees: originalImageHeightInDegrees * 2,
        widthInDegrees: originalImageWidthInDegrees * 2,
        minLatitude: imageMinLatitude,
        minLongitude: imageMinLongitude,
      });
      element = await fixture(html` <map-image
        .converter="${coordinateConverter}"
        height="${frameHeight}"
        width="${frameWidth}"
      ></map-image>`);
    });

    xit('assigns a sensible scale to the map', () => {
      const img = element.shadowRoot.querySelector('img');
      expect(img).to.exist;

      const style = img.getAttribute('style');
      expect(style).to.contain(`width: ${frameWidth / 2}px`);
      expect(style).to.contain(`height: ${frameHeight / 2}px`);
    });

    xit('does not adjust the position of the map', () => {
      const img = element.shadowRoot.querySelector('img');
      expect(img).to.exist;

      // If the minimums are the same, the map should be in the bottom left corner
      const { x, y } = getTranslateTransform(element);
      // We actually do need to shift the image to centre it
      expect(Math.round(x)).to.equal((-1 * frameWidth) / 2);
      expect(Math.round(y)).to.equal(0);
    });

    it('assigns the right size to the container', () => {
      const div = element.shadowRoot.querySelector('div');
      expect(div).to.exist;
      const style = div.getAttribute('style');
      expect(style).to.contain(`width: ${frameWidth}px`);
      expect(style).to.contain(`height: ${frameHeight}px`);
    });
  });

  describe('when the map would cover twice the plotted area, exactly centred', () => {
    beforeEach(async () => {
      const coordinateConverter = getCoordinateConverter({
        heightInDegrees: originalImageHeightInDegrees / 2,
        widthInDegrees: originalImageWidthInDegrees / 2,
        minLatitude: imageMinLatitude + originalImageHeightInDegrees / 4,
        minLongitude: imageMinLongitude + originalImageWidthInDegrees / 4,
      });
      element = await fixture(html` <map-image
        .converter="${coordinateConverter}"
        height="${frameHeight}"
        width="${frameWidth}"
      ></map-image>`);
    });

    xit('assigns a sensible scale to the map', () => {
      const img = element.shadowRoot.querySelector('img');
      expect(img).to.exist;

      const style = img.getAttribute('style');
      const fudgeFactor = -5;
      expect(style).to.contain(
        `width: ${frameWidth * 2 * frameAspectRatio + fudgeFactor}px`
      );
      expect(style).to.contain(`height: ${frameHeight * 2 + fudgeFactor}px`);
    });

    xit('adjusts the position of the map to put it off the canvas by a quarter', () => {
      // If the minimums are the same, the map should be in the bottom left corner
      const { x, y } = getTranslateTransform(element);

      // We actually do need to shift the image to centre it
      expect(Math.round(x)).to.equal((-3 * frameWidth) / 4);
      expect(Math.round(y)).to.equal((-1 * frameHeight) / 4);
    });

    it('assigns the right size to the container', () => {
      const div = element.shadowRoot.querySelector('div');
      expect(div).to.exist;
      const style = div.getAttribute('style');
      expect(style).to.contain(`width: ${frameWidth}px`);
      expect(style).to.contain(`height: ${frameHeight}px`);
    });
  });

  describe('when the map has only a single point, in the exact centre of the image', () => {
    beforeEach(async () => {
      const coordinateConverter = getCoordinateConverter({
        heightInDegrees: 0,
        widthInDegrees: 0,
        minLatitude: imageMinLongitude + originalImageWidthInDegrees / 2,
        minLongitude: imageMinLatitude + originalImageHeightInDegrees / 2,
      });
      element = await fixture(html` <map-image
        .converter="${coordinateConverter}"
        height="${frameHeight}"
        width="${frameWidth}"
      ></map-image>`);
    });

    it('assigns an arbitrary (but large) scale to the map', () => {
      const { width, height } = getDimensions(element);
      expect(width).to.be.greaterThan(frameWidth);
      expect(height).to.be.greaterThan(frameHeight);
    });

    xit('shifts the map up', () => {
      const { y } = getTranslateTransform(element);
      const { height } = getDimensions(element);
      // We do need to shift the image to centre it, and unshift a bit since 0 is at the top of the frame
      expect(Math.round(y)).to.equal(
        Math.round((frameHeight - height) / 2) - 1
      );
    });

    it('shifts the map left', () => {
      const { x } = getTranslateTransform(element);
      const { width } = getDimensions(element);
      // We need to shift the image to centre it
      expect(Math.round(x)).to.equal(Math.round((-1 * width) / 2));
    });

    it('assigns the right size to the container', () => {
      const div = element.shadowRoot.querySelector('div');
      expect(div).to.exist;
      const style = div.getAttribute('style');
      expect(style).to.contain(`width: ${frameWidth}px`);
      expect(style).to.contain(`height: ${frameHeight}px`);
    });
  });

  describe('when the map has only a single point, on the left edge of the image', () => {
    beforeEach(async () => {
      const coordinateConverter = getCoordinateConverter({
        heightInDegrees: 0,
        widthInDegrees: 0,
        minLatitude: imageMinLatitude,
        minLongitude: imageMinLongitude,
      });
      element = await fixture(html` <map-image
        .converter="${coordinateConverter}"
        height="${frameHeight}"
        width="${frameWidth}"
      ></map-image>`);
    });

    it('assigns an arbitrary (but large) scale to the map', () => {
      const { width, height } = getDimensions(element);

      expect(width).to.be.greaterThan(frameWidth);
      expect(height).to.be.greaterThan(frameHeight);
    });

    xit('shifts the map to center the point', () => {
      const { x, y } = getTranslateTransform(element);
      // The dot is on the edge of the image, so we should shift it by half
      // ... except that 0 is centred, in the x-coordinate system being used
      expect(Math.round(x)).to.equal(0);
      expect(Math.round(y)).to.equal(frameHeight / 2);
    });

    it('assigns the right size to the container', () => {
      const div = element.shadowRoot.querySelector('div');
      expect(div).to.exist;
      const style = div.getAttribute('style');
      expect(style).to.contain(`width: ${frameWidth}px`);
      expect(style).to.contain(`height: ${frameHeight}px`);
    });
  });

  describe('when the map has only a single point, on the right edge of the image', () => {
    beforeEach(async () => {
      const coordinateConverter = getCoordinateConverter({
        heightInDegrees: 0,
        widthInDegrees: 0,
        minLatitude: imageMinLatitude,
        minLongitude: imageMinLongitude + originalImageWidthInDegrees,
      });
      element = await fixture(html` <map-image
        .converter="${coordinateConverter}"
        height="${frameHeight}"
        width="${frameWidth}"
      ></map-image>`);
    });

    it('assigns an arbitrary (but large) scale to the map', () => {
      const { width, height } = getDimensions(element);

      expect(width).to.be.greaterThan(frameWidth);
      expect(height).to.be.greaterThan(frameHeight);
    });

    xit('shifts the map left to center the point', () => {
      const { width } = getDimensions(element);
      const { x } = getTranslateTransform(element);
      // The dot is on the edge of the image, so we should shift it by half
      // ... except that 0 is centred, in the x-coordinate system being used
      expect(Math.round(x)).to.equal(-1 * width);
    });

    xit('shifts the map down to center the point', () => {
      const { height } = getDimensions(element);
      const { y } = getTranslateTransform(element);
      // The dot is on the edge of the image, so we should shift it by half
      // ... except that 0 is centred, in the x-coordinate system being used
      expect(Math.round(y)).to.equal(height / 2);
    });

    it('assigns the right size to the container', () => {
      const div = element.shadowRoot.querySelector('div');
      expect(div).to.exist;
      const style = div.getAttribute('style');
      expect(style).to.contain(`width: ${frameWidth}px`);
      expect(style).to.contain(`height: ${frameHeight}px`);
    });
  });
});
