import { templit } from './compile.js';

class MyEl extends HTMLElement {
  static get boundAttributes() {
    return ['who'];
  }
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
    this.renderTemplate = templit(this._shadowRoot, this);
  }

  connectedCallback() {
    this.who = 'Caleb';

    this.render();
  }

  get who() {
    return this.getAttribute('who');
  }

  set who(_who) {
    _who ? this.setAttribute('who', _who) : this.removeAttribute('who');
  }

  log(event, who) {
    if (this.who === 'Caleb') {
      this.who = 'world';
    } else {
      this.who = 'Caleb';
    }
  }

  update(event) {
    event.preventDefault();
    const inputs = this._shadowRoot.querySelector('form').querySelectorAll('[name]');

    inputs.forEach(input => {
      console.log(input.name, input.value);
    });
    this.who = this._shadowRoot.querySelector('input').value;
  }

  render() {
    this.renderTemplate`
      <style>
        .Caleb {
          color: tomato;
        }
        .Leland {
          color: rebeccapurple;
        }
        .world {
          color: mediumaquamarine;
        }
      </style>
      <h1 class="heading" role="header">Hello ${this.who}</h1>
      <div class="${this.who} arbitrary">
        <h2>Test</h2>
      </div>
      <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean sapien magna, aliquet non massa dapibus, convallis porta sem. Phasellus laoreet, turpis et feugiat malesuada, quam magna tincidunt diam, at tempor sapien nisl nec elit. Curabitur suscipit mi eu dolor tempor luctus eu vel tortor.</p>

      <p>Vivamus efficitur nulla nec nulla faucibus ultricies. Sed sed lacus vel nisl mattis aliquet quis rhoncus magna. Etiam aliquam eget leo nec tincidunt. Maecenas lacinia consectetur augue, vitae euismod augue eleifend quis. Mauris et aliquam velit.</p>

      <p>Quisque sit amet lorem in mauris viverra facilisis. Vestibulum pharetra elit eget eleifend tempor.</p>

      <form (submit)="this.update(event)">
        <label for="name">Name</name>
        <input id="name" type="text" name="name">

        <button>Submit</button>
      </div>

      <button (click)="this.log(event, this.who)">Toggle world/Caleb</button>
    `;
  }
}

customElements.define('my-el', MyEl);
