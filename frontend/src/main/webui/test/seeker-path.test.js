import { html } from 'lit';
import { expect, fixture } from '@open-wc/testing';

import '../src/components/seeker-path.js';

describe('Seeker Path', () => {
  let element;

  describe('with no data', () => {
    beforeEach(async () => {
      element = await fixture(html` <seeker-path></seeker-path>`);
    });

    afterEach(() => {
      window.fetch.restore(); // remove stub
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

      element = await fixture(html` <seeker-path
        .points="${data}"
        count="3"
      ></seeker-path>`);
    });

    afterEach(() => {
      window.fetch.restore(); // remove stub
    });

    it('renders an svg', () => {
      const svg = element.shadowRoot.querySelector('svg');
      expect(svg).to.exist;
    });

    it('renders a path', () => {
      const el = element.shadowRoot.querySelector('path');
      expect(el).to.exist;
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
