import { compile } from '../compile.js';

class BaseComponent extends HTMLElement {
  constructor() {
    super();
    this._shadowRoot = this.attachShadow({ mode: 'open' });
  }

  compile(location) {
    return compile(this, location);
  }
}

class MyEl extends BaseComponent {
  constructor() {
    super();
  }

  connectedCallback() {
    this.who = 'Caleb';

    this.render(this._shadowRoot);
  }

  render(location) {
    this.compile(location)`<h1>${this.who}</h1>`;
  }
}

customElements.define('my-el', MyEl);

// import { helloWorld } from './helloWorld.js';
// import { html, render } from '../node_modules/lit-html/lit-html.js';
// // setTimeout(helloWorld, 2000);
// class Template {
//   constructor(element, values) {
//     this.element = element;
//     this.values = values;
//     this.clone = document.importNode(this.element.content, true);
//   }
//
//   render(location) {
//
//     location.appendChild(this.clone);
//   }
// }
// function html2(strings, ...vars) {
//     const element = document.createElement('template');
//     const output = strings.map((string, index) => {
//       let template = '';
//       if (string) {
//         template += string;
//       }
//       if (vars[index]) {
//         // template += `${vars[index]}`;
//         template += `{{${index}}}`;
//       }
//       return template;
//     }).join('');
//
//     element.innerHTML = output;
//     const template = new Template(element, vars);
//     return template;
// }
//
// let who = 'world';
// const template = () => html`<h1>Hello ${who}</h1>`;
//
// // console.log(template());
//
//
// class TestEl extends HTMLElement {
//   static get who() { return 'static'; }
//   static get tagName() { return 'test-el'; }
//   get template() {
//     return html2`<h2>What's up, ${this.who}</h2>`;
//   }
//
//   constructor() {
//     super();
//     this.who = 'instance';
//   }
//
//   connectedCallback() {
//     this.render();
//   }
//
//   log() {
//     console.log('yup');
//   }
//
//   render() {
//     if (this.__template__) {
//       // this.innerHTML = this.__template__.render();
//       this.__template__.render(this);
//     } else {
//       const template = this.template;
//       this.__template__ = template;
//       this.render();
//     }
//   }
//
// }
//
// customElements.define(TestEl.tagName, TestEl);
// import { html, render } from './html.js';
//
// let who = 'world';
//
// const template = html`<h1>Hello ${who}`;
//
// console.log(template);
//
// render(template, document.body);
