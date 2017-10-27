import { templiteral } from '../templiteral.js';

class MyEl extends HTMLElement {
  static get tagName() { return 'my-el'; }
  static get boundAttributes() { return ['name']; }
  static get observedAttributes() {
    return ['test', ...this.boundAttributes];
  }

  attributeChangedCallback(name) {
    if (this.constructor.boundAttributes.includes(name)) {
      this.render();
    }
  }

  constructor() {
    super();
    this._shadowRoot = this.attachShadow({ mode: 'open' });
    this.renderTemplate = templiteral(this._shadowRoot, this);
    this.pContentEditable = false;
  }

  connectedCallback() {
    this.name = 'everyone';

    this.render();
  }

  disconnectedCallback() {
    this._shadowRoot.__compiler.disconnect();
  }

  get buttonMessage() {
    return this.name === 'everyone' ? 'Set name to everyone' : 'Set name to world';
  }

  get name() {
    return this.getAttribute('name');
  }

  set name(_name) {
    _name ? this.setAttribute('name', _name) : this.removeAttribute('name');
  }

  toggleContentEditable() {
    this.pContentEditable = !this.pContentEditable;
    this.render();
  }

  toggleName(event, name) {
    event.preventDefault();
    if (this.name === 'everyone') {
      this.name = 'world';
    } else {
      this.name = 'everyone';
    }
  }

  update(event) {
    event.preventDefault();
    const inputs = this._shadowRoot.querySelector('form').querySelectorAll('[name]');

    inputs.forEach(input => {
      // console.log(input.name, input.value);
    });

    this.name = this._shadowRoot.querySelector('input').value;
  }

  updateName() {
    this.name = this._shadowRoot.querySelector('input').value;
  }

  render() {
    this._template = this.renderTemplate`
      <style>
        .everyone {
          color: tomato;
        }
        .someone {
          color: rebeccapurple;
        }
        .world {
          color: mediumaquamarine;
        }
        [contenteditable] {
          border: 1px dotted #1a1a1a;
          border-right: 5px solid #bada55;
          padding: 5px;
          transition: all 0.2s ease;
        }
      </style>
      <h1 class="heading" role="header">Hello ${this.name}</h1>
      <div class="${this.name} arbitrary">
        <h2>Test</h2>
      </div>
      <p [contentEditable]="${this.pContentEditable}">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean sapien magna, aliquet non massa dapibus, convallis porta sem. Phasellus laoreet, turpis et feugiat malesuada, quam magna tincidunt diam, at tempor sapien nisl nec elit. Curabitur suscipit mi eu dolor tempor luctus eu vel tortor.</p>

      <p>Vivamus efficitur nulla nec nulla faucibus ultricies. Sed sed lacus vel nisl mattis aliquet quis rhoncus magna. Etiam aliquam eget leo nec tincidunt. Maecenas lacinia consectetur augue, vitae euismod augue eleifend quis. Mauris et aliquam velit.</p>

      <p>Quisque sit amet lorem in mauris viverra facilisis. Vestibulum pharetra elit eget eleifend tempor.</p>

      <form (submit)="this.update(event)">
        <label for="name">Name</name>
        <input id="name" type="text" name="name" (input)="this.updateName()">

        <button>Submit</button>
      </form>

      <button (click)="this.toggleName(event, this.name)">${this.buttonMessage}</button>
      <button (click)="this.toggleContentEditable()">Toggle content editable</button>

    `;
  }
}

customElements.define(MyEl.tagName, MyEl);
