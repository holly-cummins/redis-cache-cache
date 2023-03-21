import { css, html, LitElement } from 'lit';

class StartGameButton extends LitElement {
  static styles = css`
    button {
      background-color: green;
      color: white;
      padding: 1em;
      font-size: 1em;
    }
  `;

  render() {
    return html` <button @click="${this.fetchData}">Démarrer un jeu</button> `;
  }

  static fetchData = async () => {
    await fetch('http://localhost:8091/games', {
      method: 'POST',
    });
  };
}

// Custom elements have to have a hyphen in the name, even in cases like this, where it doesn't really make sense
customElements.define('start-game-button', StartGameButton);
