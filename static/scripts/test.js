import { Component } from '../templiteral.js';

class YesComp extends Component {
  static get boundAttributes() { return ['id', 'active']; }
  static get booleanAttributes() { return ['active']; }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  changeActive() {
    console.log(this.active, this.state.active);
    this.state.active = !this.state.active;
  }

  render() {
    this.html`
      <div style="color: ${this.state.active ? 'tomato' : 'rebeccapurple' }">
        <h1>${this.id}</h1>
        <button (click)="${this.changeActive}">${this.state.active}</h2>
      </div>
    `;
  }
}

customElements.define('yes-comp', YesComp);

class NoComp extends HTMLElement {
  static get observedAttributes() {
    return ['id', 'active'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.render();
    this._button = this.shadowRoot.querySelector('button');
    this._button.addEventListener('click', this.changeActive.bind(this));
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'id' && newValue !== oldValue) {
      this.id = newValue;
      this.render();
    } else if (name === 'active' && newValue === '' && oldValue !== '') {
      this.active = this.hasAttribute('active');
      this.render();
    }
  }

  get active() {
    return this.hasAttribute('active');
  }

  set active(_active) {
    _active ? this.setAttribute('active', _active) : this.removeAttribute('active');
  }

  changeActive() {
    if (this.active !== 'false') {
      this.active = !this.active;
    } else {
      this.active = true;
    }
    this.render();
  }

  render() {
    this.shadowRoot.innerHTML = `
    <div style="color: ${this.active ? 'tomato' : 'rebeccapurple' }">
      <h1>${this.id}</h1>
      <button>${this.active}</h2>
    </div>
    `;
  }
}

customElements.define('no-comp', NoComp);

for (let i = 0; i < 1000; i += 1) {
  const el = document.createElement('yes-comp');
  el.setAttribute('id', i);
  !!(i % 2) && el.setAttribute('active', !!(i % 2));
  document.body.appendChild(el);
}
