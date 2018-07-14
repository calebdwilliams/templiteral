import { Component } from '../templiteral.js';

export class BindTo extends Component {
  static get renderer() { return 'render'; }

  static get boundAttributes() {
    return ['info'];
  }
  
  render() {
    this.html`<h2>Info: ${this.info}</h2>`;
  }
}

customElements.define('bind-to', BindTo);
