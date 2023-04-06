import { css, LitElement } from 'lit';

/* Common styles */
export class BaseElement extends LitElement {
  // It should work to set a body style, but it does not
  static styles = css`
    div {
      font-size: 14px;
    }

    h2 {
      font-size: 16px;
    }
  `;
}

customElements.define('base-element', BaseElement);
