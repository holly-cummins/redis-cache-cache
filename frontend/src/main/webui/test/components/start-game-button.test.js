import { html } from 'lit';
import { expect, fixture } from '@open-wc/testing';
import sinon from 'sinon';

import '../../src/components/start-game-button.js';

describe('Start Game Button', () => {
  let element;
  let stubbedFetch;

  beforeEach(async () => {
    stubbedFetch = sinon.stub(window, 'fetch');

    element = await fixture(html` <start-game-button></start-game-button>`);
  });

  afterEach(() => {
    window.fetch.restore(); // remove stub
  });

  it('renders a button', () => {
    const button = element.shadowRoot.querySelector('button');
    expect(button).to.exist;
    expect(button.textContent).to.contain('Start game');
  });

  it('sends a post request on click', () => {
    expect(stubbedFetch).to.have.callCount(0);
    const button = element.shadowRoot.querySelector('button');
    expect(button).to.exist;
    button.click();
    expect(stubbedFetch).to.have.callCount(1);
    expect(stubbedFetch.getCall(0).args[1]).to.deep.equal({ method: 'POST' });
  });

  it('passes the a11y audit', async () => {
    await expect(element).shadowDom.to.be.accessible();
  }).timeout(10000);
});
