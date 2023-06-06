import { html } from 'lit';
import { expect, fixture } from '@open-wc/testing';

import '../../src/components/hiders.js';

describe('Hiders', () => {
  let element;

  describe('with no data', () => {
    beforeEach(async () => {
      element = await fixture(html` <hidey-holes></hidey-holes>`);
    });

    it('renders an svg', () => {
      const svg = element.shadowRoot.querySelector('svg');
      expect(svg).to.exist;
    });

    it('passes the a11y audit', async () => {
      await expect(element).shadowDom.to.be.accessible();
    }).timeout(10000);
  });

  describe('with some points', () => {
    beforeEach(async () => {
      const data = [
        { from: [0, 0], to: [1, 1] },
        { from: [0, 10], to: [10, 1] },
        { from: [20, 0], to: [1, 12] },
      ];

      element = await fixture(html` <hidey-holes
        .points="${data}"
        count="3"
      ></hidey-holes>`);
    });

    it('renders an svg', () => {
      const svg = element.shadowRoot.querySelector('svg');
      expect(svg).to.exist;
    });

    it('renders a marker', () => {
      const el = element.shadowRoot.querySelector('circle');
      expect(el).to.exist;
    });

    it('passes the a11y audit', async () => {
      await expect(element).shadowDom.to.be.accessible();
    }).timeout(10000);
  });
});
