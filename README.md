# Templiteral

A light-weight, standards-compliant JavaScript to HTML renderer intended to allow authors to quickly and easily add bindings and selective re-renderings in their HTML files. Works best with the Web Components `customElements`.

## How it Works

The `templiteral` function takes two arguments (a location and a context) and returns a function that serves as an ECMAScript 2015 template literal tag, a function that takes in a template literal and returns some other object. Repeated calls to this function will update the previously-inserted DOM nodes if a binding is present.

## Example

```javascript
import { templiteral } from 'templiteral';

class MyEl extends HTMLElement {
  constructor() {
    super();

    this._shadowRoot = this.attachShadow({ mode: 'open' });
    this.renderTemplate = templiteral(this._shadowRoot, this);

    this.name = 'templiteral';
  }

  connectedCallback() {
    this.render();
  }

  render() {
    this.renderTemplate`
    <h1>Hello ${this.name}</h1>
    <p>You're alright.</p>`;
  }
}

customElements.define('my-el', MyEl);
```

Now when an instance of `my-el` is inserted into the DOM, the `render` method will be called and insert the template into the element's shadow root.

## Event and property bindings

Templiteral provides Angular 2+-style event bindings using the `(<eventName>)="this.eventHandler(...args)"` syntax. Similarly property bindings are using the bracket notation `[<propertyName>]="${this.someProp}"`. 
