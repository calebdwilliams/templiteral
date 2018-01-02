import { templiteral } from '../templiteral.js';

class MyEl extends HTMLElement {
  static get tagName() { return 'my-el'; }
  static get boundAttributes() { return ['username', 'abc']; }
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
    this.attachShadow({ mode: 'open' });
    this.pContentEditable = false;
    this.templiteral = templiteral;
  }

  connectedCallback() {
    this.username = 'everyone';
    this.abc = 'no one';

    this.render();
  }

  disconnectedCallback() {
    this._shadowRoot.template.disconnect();
  }

  get buttonMessage() {
    return this.username === 'everyone' ? 'Set name to everyone' : 'Set name to world';
  }

  get username() {
    return this.getAttribute('username');
  }

  set username(_username) {
    _username ? this.setAttribute('username', _username) : this.removeAttribute('username');
  }

  toggleContentEditable() {
    this.pContentEditable = !this.pContentEditable;
    console.log(this.pContentEditable)
    this.render();
  }

  toggleName(event) {
    event.preventDefault();
    if (this.username === 'everyone') {
      this.username = 'world';
    } else {
      this.username = 'everyone';
    }
  }

  update(event) {
    event.preventDefault();
    const inputs = this.shadowRoot.querySelector('form').querySelectorAll('[username]');

    inputs.forEach(input => {
      // console.log(input.name, input.value);
    });

    this.username = this.shadowRoot.querySelector('input').value;
  }

  updateName() {
    this.username = this.shadowRoot.querySelector('input').value;
  }

  render() {
    this._ = this.templiteral()`
      <style>
        * {
          font-family: Optimist
        }
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
      <h1 class="heading" role="header">Hello ${this.username}</h1>
      <div class="${this.username} arbitrary">
        <h2>Test</h2>
      </div>
      <p [contentEditable]="${this.pContentEditable}">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean sapien magna, aliquet non massa dapibus, convallis porta sem. Phasellus laoreet, turpis et feugiat malesuada, quam magna tincidunt diam, at tempor sapien nisl nec elit. Curabitur suscipit mi eu dolor tempor luctus eu vel tortor.</p>
      
      <p>${this.pContentEditable} — ${this.username}</p>

      <p>Vivamus efficitur nulla nec nulla faucibus ultricies. Sed sed lacus vel nisl mattis aliquet quis rhoncus magna. Etiam aliquam eget leo nec tincidunt. Maecenas lacinia consectetur augue, vitae euismod augue eleifend quis. Mauris et aliquam velit.</p>

      <p>Quisque sit amet lorem in mauris viverra facilisis. Vestibulum pharetra elit eget eleifend tempor.</p>

      <form (submit)="this.update(event)">
        <label for="username">User name</label>
        <input id="username" type="text" name="username" (input)="this.updateName()" [value]="${this.username}">

        <button>Submit</button>
      </form>

      <button (click)="this.toggleName(event)">${this.buttonMessage}</button>
      <button (click)="this.toggleContentEditable()">Toggle content editable</button>

    `;
  }
}

customElements.define(MyEl.tagName, MyEl);
