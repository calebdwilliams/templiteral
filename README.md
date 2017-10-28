# Templiteral

A light-weight, standards-compliant JavaScript to HTML renderer intended to allow authors to quickly and easily add bindings and selective re-renderings in their HTML files. Works best with the Web Components `customElements`.

## Installation

Install with npm or yarn.

```bash
npm i templiteral
# OR
yarn add templiteral
```

## How it Works

The `templiteral` function takes two arguments (a location and a context) and returns a function that serves as an ECMAScript 2015 [template literal tag](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals), a function that takes in a template literal and returns some other object. Repeated calls to this function will update the previously-inserted DOM nodes if a binding is present.

So a template literal tag would look like the following:

```javascript
function myTag(strings, ...values) {
  return strings.map((string, index) => `${string} values[index]`).join('');
}
const message = 'world';
myTag`Hello ${message}`; // Hello world
```

The templiteral function returns a tag function that serves as a renderer.

## Example

```javascript
import { templiteral } from 'templiteral';

class MyEl extends HTMLElement {
  constructor() {
    super();

    this._shadowRoot = this.attachShadow({ mode: 'open' });
    this.name = 'templiteral';
  }

  connectedCallback() {
    this.render();
  }

  render() {
    templiteral(this._shadowRoot, this)`
      <h1>Hello ${this.name}</h1>
      <p>You're alright.</p>
    `;
  }
}

customElements.define('my-el', MyEl);
```

Now when an instance of `my-el` is inserted into the DOM, the `render` method will be called and insert the template into the element's shadow root.

## Event and property bindings

Templiteral provides Angular 2+-style event bindings using the `(<eventName>)="this.eventHandler(...args)"` syntax.

```javascript
<button (click)="this.logClickEvent(event)">Log a message</button>
```

This would call the component's `logClickEvent` with the event object as the argument. As you might expect, you can also pass object properties or other arguments in the function invocation as well.

Similarly property bindings are using the bracket notation `[<propertyName>]="${this.someProp}"`.

```javascript
<input type="text" id="name" name="name" [required]="${this.isRequired}">
```
