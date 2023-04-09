import { html } from 'lit';
import { expect, fixture } from '@open-wc/testing';
import '../src/components/map-image.js';

// We have to hard code these here because exporting seems hard

// This value needs to be hand-tuned
const imageMinLatitude = 48.785;
const imageMaxLatitude = 48.93;

const imageMinLongitude = 2.24;
const imageMaxLongitude = 2.5;

const originalImageHeightInDegrees = imageMaxLatitude - imageMinLatitude;
const originalImageWidthInDegrees = imageMaxLongitude - imageMinLongitude;

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

    it('does not adjust the position of the map', () => {
      const img = element.shadowRoot.querySelector('img');
      expect(img).to.exist;

      const style = img.getAttribute('style');
      expect(style).to.contain(`transform: translate(0px, 0px)`);
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

  describe('when the map should only cover half the canvas', () => {
    const frameHeight = 1668;
    const frameWidth = 2224;

    beforeEach(async () => {
      element = await fixture(html` <map-image
        height="${frameHeight}"
        width="${frameWidth}"
        heightInDegrees="${originalImageHeightInDegrees * 2}"
        widthInDegrees="${originalImageWidthInDegrees * 2}"
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
      expect(style).to.contain(`width: ${frameWidth / 2}px`);
      expect(style).to.contain(`height: ${frameHeight / 2}px`);
    });

    it('does not adjust the position of the map', () => {
      const img = element.shadowRoot.querySelector('img');
      expect(img).to.exist;

      const style = img.getAttribute('style');

      // If the minimums are the same, the map should be in the bottom left corner
      expect(style).to.contain(`transform: translate(0px, 0px)`);
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
});
