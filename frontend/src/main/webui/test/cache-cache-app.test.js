import { html } from 'lit';
import { expect, fixture } from '@open-wc/testing';

import '../src/cache-cache-app.js';

describe('CacheCacheApp', () => {
  let element;
  beforeEach(async () => {
    element = await fixture(html` <cache-cache-app></cache-cache-app>`);
  });

  it('renders a h1', () => {
    const h1 = element.shadowRoot.querySelector('h1');
    expect(h1).to.exist;
    expect(h1.textContent).to.equal("C'est cache-cache!");
  });

  it('passes the a11y audit', async () => {
    await expect(element).shadowDom.to.be.accessible();
  });
});
