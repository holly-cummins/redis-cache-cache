import { html } from 'lit';
import { expect, fixture } from '@open-wc/testing';
import { sendKeys } from '@web/test-runner-commands';
import sinon from 'sinon';

import '../../src/components/add-place-button.js';

describe('Add place Button', () => {
  let element;
  let stubbedDispatch;

  beforeEach(async () => {
    stubbedDispatch = sinon.stub(window, 'dispatchEvent');

    element = await fixture(html` <add-place-button></add-place-button>`);
  });

  afterEach(() => {
    window.dispatchEvent.restore(); // remove stub
  });

  it('renders a button', () => {
    const button = element.shadowRoot.querySelector('button');
    expect(button).to.exist;
    expect(button.textContent).to.contain('lieu');
  });

  it('sends an event on click', () => {
    expect(stubbedDispatch).to.have.callCount(0);
    const button = element.shadowRoot.querySelector('button');
    expect(button).to.exist;
    button.click();
    expect(stubbedDispatch).to.have.callCount(1);
  });

  it('renders a text field', () => {
    const input = element.shadowRoot.querySelector('input');
    expect(input).to.exist;
    expect(input.placeholder).to.contain('Lieu');
  });

  it('sends the place name on click', async () => {
    expect(stubbedDispatch).to.have.callCount(0);
    const input = element.shadowRoot.querySelector('input');
    expect(input).to.exist;
    input.focus();

    const typedText = 'Printemps';
    await sendKeys({
      type: typedText,
    });
    await sendKeys({
      type: '\n',
    });
    element.focus();

    expect(input.value).to.equal(typedText);

    const button = element.shadowRoot.querySelector('button');
    expect(button).to.exist;
    button.click();
    expect(stubbedDispatch).to.have.callCount(1);
    expect(stubbedDispatch.getCall(0).args[0].detail).to.deep.equal({
      place: typedText,
    });
  });

  it('passes the a11y audit', async () => {
    await expect(element).shadowDom.to.be.accessible();
  }).timeout(10000);
});
