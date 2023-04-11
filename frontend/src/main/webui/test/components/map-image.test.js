import { html } from 'lit';
import { expect, fixture } from '@open-wc/testing';
import '../../src/components/map-image.js';

// We have to hard code these here because exporting seems hard

// This value needs to be hand-tuned
const imageMinLatitude = 48.81;
const imageMaxLatitude = 48.91;

const imageMinLongitude = 2.22;
const imageMaxLongitude = 2.45;

const originalImageHeightInDegrees = imageMaxLatitude - imageMinLatitude;
const originalImageWidthInDegrees = imageMaxLongitude - imageMinLongitude;

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
  const matcher = /translate\((-?[0-9.]+)%, ?(-?[0-9.]+)%\)/m;
  expect(style).to.match(matcher);
  const transformMatch = style.match(matcher);
  const x = +transformMatch[1];
  const y = +transformMatch[2];
  return { x, y };
}

describe('Map image', () => {
  let element;

  describe('when the map fits exactly into the frame', () => {
    const frameHeight = 1668;
    const frameWidth = 2224;

    beforeEach(async () => {
      element = await fixture(html` <map-image
        height="${frameHeight}"
        width="${frameWidth}"
        heightInDegrees="${originalImageHeightInDegrees}"
        widthInDegrees="${originalImageWidthInDegrees}"
        minLatitude="${imageMinLatitude}"
        minLongitude="${imageMinLongitude}"
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

    it('assigns a sensible scale to the map', () => {
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
      expect(Math.round(x)).to.equal(-50);
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
    const frameHeight = 1668;
    const frameWidth = 2224;

    beforeEach(async () => {
      element = await fixture(html` <map-image
        height="${frameHeight}"
        width="${frameWidth}"
        heightInDegrees="${originalImageHeightInDegrees * 2}"
        widthInDegrees="${originalImageWidthInDegrees * 2}"
        minLatitude="${imageMinLatitude} "
        minLongitude="${imageMinLongitude}"
      ></map-image>`);
    });

    it('assigns a sensible scale to the map', () => {
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
      expect(Math.round(x)).to.equal(-50);
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
    const frameHeight = 1668;
    const frameWidth = 2224;

    beforeEach(async () => {
      element = await fixture(html` <map-image
        height="${frameHeight}"
        width="${frameWidth}"
        heightInDegrees="${originalImageHeightInDegrees * 2}"
        widthInDegrees="${originalImageWidthInDegrees * 2}"
        minLatitude="${imageMinLatitude - originalImageHeightInDegrees / 4} "
        minLongitude="${imageMinLongitude - originalImageWidthInDegrees / 4}"
      ></map-image>`);
    });

    it('assigns a sensible scale to the map', () => {
      const img = element.shadowRoot.querySelector('img');
      expect(img).to.exist;

      const style = img.getAttribute('style');
      expect(style).to.contain(`width: ${frameWidth / 2}px`);
      expect(style).to.contain(`height: ${frameHeight / 2}px`);
    });

    xit('adjusts the x position of the map by a quarter', () => {
      // If the minimums are the same, the map should be in the bottom left corner
      const { x, y } = getTranslateTransform(element);
      // We actually do need to shift the image to centre it
      expect(Math.round(x)).to.equal(-25);
      expect(Math.round(y)).to.equal(25);
    });

    xit('adjusts the y position of the map by a quarter', () => {
      // If the minimums are the same, the map should be in the bottom left corner
      const { y } = getTranslateTransform(element);
      // We actually do need to shift the image to centre it
      expect(Math.round(y)).to.equal(25);
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
    const frameHeight = 1668;
    const frameWidth = 2224;

    beforeEach(async () => {
      element = await fixture(html` <map-image
        height="${frameHeight}"
        width="${frameWidth}"
        heightInDegrees="${originalImageHeightInDegrees * 2}"
        widthInDegrees="${originalImageWidthInDegrees * 2}"
        minLatitude="${imageMinLatitude} "
        minLongitude="${imageMinLongitude}"
      ></map-image>`);
    });

    it('assigns a sensible scale to the map', () => {
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
      expect(Math.round(x)).to.equal(-50);
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
    const frameHeight = 1668;
    const frameWidth = 2224;

    beforeEach(async () => {
      element = await fixture(html` <map-image
        height="${frameHeight}"
        width="${frameWidth}"
        heightInDegrees="${originalImageHeightInDegrees / 2}"
        widthInDegrees="${originalImageWidthInDegrees / 2}"
        minLatitude="${imageMinLatitude + originalImageHeightInDegrees / 4} "
        minLongitude="${imageMinLongitude + originalImageWidthInDegrees / 4}"
      ></map-image>`);
    });

    it('assigns a sensible scale to the map', () => {
      const img = element.shadowRoot.querySelector('img');
      expect(img).to.exist;

      const style = img.getAttribute('style');
      expect(style).to.contain(`width: ${frameWidth * 2}px`);
      expect(style).to.contain(`height: ${frameHeight * 2}px`);
    });

    xit('adjusts the position of the map to put it off the canvas by a quarter', () => {
      // If the minimums are the same, the map should be in the bottom left corner
      const { x, y } = getTranslateTransform(element);

      // We actually do need to shift the image to centre it
      expect(Math.round(x)).to.equal(-75);
      expect(Math.round(y)).to.equal(-25);
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
    const frameHeight = 1668;
    const frameWidth = 2224;

    beforeEach(async () => {
      element = await fixture(html` <map-image
        height="${frameHeight}"
        width="${frameWidth}"
        heightInDegrees="0"
        widthInDegrees="0"
        minLatitude="${imageMinLatitude + originalImageHeightInDegrees / 2} "
        minLongitude="${imageMinLongitude + originalImageWidthInDegrees / 2}"
      ></map-image>`);
    });

    it('assigns an arbitrary (but large) scale to the map', () => {
      const { width, height } = getDimensions(element);
      expect(width).to.be.greaterThan(frameWidth);
      expect(height).to.be.greaterThan(frameHeight);
    });

    xit('shifts the map up and left', () => {
      const { x, y } = getTranslateTransform(element);
      // We actually do need to shift the image to centre it
      expect(Math.round(x)).to.equal(-50);
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

  describe('when the map has only a single point, on the left edge of the image', () => {
    const frameHeight = 1668;
    const frameWidth = 2224;

    beforeEach(async () => {
      element = await fixture(html` <map-image
        height="${frameHeight}"
        width="${frameWidth}"
        heightInDegrees="0"
        widthInDegrees="0"
        minLatitude="${imageMinLatitude}"
        minLongitude="${imageMinLongitude}"
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
      expect(Math.round(y)).to.equal(50);
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
    const frameHeight = 1668;
    const frameWidth = 2224;

    beforeEach(async () => {
      element = await fixture(html` <map-image
        height="${frameHeight}"
        width="${frameWidth}"
        heightInDegrees="0"
        widthInDegrees="0"
        minLatitude="${imageMinLatitude}"
        minLongitude="${imageMaxLongitude}"
      ></map-image>`);
    });

    it('assigns an arbitrary (but large) scale to the map', () => {
      const { width, height } = getDimensions(element);

      expect(width).to.be.greaterThan(frameWidth);
      expect(height).to.be.greaterThan(frameHeight);
    });

    xit('shifts the map left to center the point', () => {
      const { x } = getTranslateTransform(element);
      // The dot is on the edge of the image, so we should shift it by half
      // ... except that 0 is centred, in the x-coordinate system being used
      expect(Math.round(x)).to.equal(-100);
    });

    xit('shifts the map down to center the point', () => {
      const { y } = getTranslateTransform(element);
      // The dot is on the edge of the image, so we should shift it by half
      // ... except that 0 is centred, in the x-coordinate system being used
      expect(Math.round(y)).to.equal(50);
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
