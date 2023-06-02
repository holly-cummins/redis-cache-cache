import { html } from 'lit';
import { expect, fixture } from '@open-wc/testing';

import '../../src/cache-cache-app.js';

describe('CacheCacheApp', () => {
  let element;
  beforeEach(async () => {
    element = await fixture(html` <cache-cache-app></cache-cache-app>`);
  });

  it('renders a div', () => {
    const el = element.shadowRoot.querySelector('div');
    expect(el).to.exist;
  });

  it('passes the a11y audit', async () => {
    await expect(element).shadowDom.to.be.accessible();
  }).timeout(20000);
});
