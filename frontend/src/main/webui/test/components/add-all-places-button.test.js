import { html } from 'lit';
import { expect, fixture } from '@open-wc/testing';
import sinon from 'sinon';

import '../../src/components/add-all-places-button.js';

describe('Add all places Button', () => {
  let element;
  let stubbedDispatch;

  beforeEach(async () => {
    stubbedDispatch = sinon.stub(window, 'dispatchEvent');

    element = await fixture(
      html` <add-all-places-button></add-all-places-button>`
    );
  });

  afterEach(() => {
    window.dispatchEvent.restore(); // remove stub
  });

  it('renders a button', () => {
    const button = element.shadowRoot.querySelector('button');
    expect(button).to.exist;
    expect(button.textContent).to.contain('lieus');
  });

  it('sends an event on click', () => {
    expect(stubbedDispatch).to.have.callCount(0);
    const button = element.shadowRoot.querySelector('button');
    expect(button).to.exist;
    button.click();
    expect(stubbedDispatch).to.have.callCount(1);
  });

  it('passes the a11y audit', async () => {
    await expect(element).shadowDom.to.be.accessible();
  }).timeout(10000);
});
