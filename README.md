# Templiteral

Templiteral is a light-weight tool to reactively generate and update markup in-browser without the need for any framework or dependencies. Designed to work with the `customElements` spec, Templiteral can be used to manage native data, property and event bindings using familiar syntax without the need for an external compiler or complicated build tools.

[Try templiteral for yourself on CodePen](https://codepen.io/calebdwilliams/pen/mXBryE).

## Installation

Install with npm or yarn.

```bash
npm i templiteral
# OR
yarn add templiteral
```

## How it Works

The `templiteral` function takes two optional arguments (a location and a context) and returns a function that serves as an ECMAScript 2015 [template literal tag](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals), a function that takes in a template literal and returns some other object. Repeated calls to this function will update the previously-inserted DOM nodes if a binding is present.

So a template literal tag would look like the following:

```javascript
function myTag(strings, ...values) {
  return strings.map((string, index) => `${string} values[index]`).join('');
}
const message = 'world';
myTag`Hello ${message}`; // Hello world
```

If the arguments aren't present, both will default to the call site's `this` and the relevant `shadowRoot` if one is present.

The templiteral function returns a tag function that serves as a renderer.

## Example

```javascript

The following example uses ESNext features and ECMAScript modules which might not be supported by all browsers:

import { templiteral } from 'templiteral';

class MyEl extends HTMLElement {
  #templiteral = templiteral;

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.username = 'templiteral';
  }

  connectedCallback() {
    this.render();
  }

  render() {
    this.#templiteral()`
      <h1>Hello ${this.username}</h1>
      <p>You're alright.</p>
    `;
  }
}

customElements.define('my-el', MyEl);
```

Now when an instance of `my-el` is inserted into the DOM, the `render` method will be called and insert the template into the element's shadow root.

## Event bindings

Templiteral provides Angular-style event bindings using the `(<eventName>)="${this.eventHandler}"` syntax.

```html
<button (click)="${this.logClickEvent}">Log a message</button>
```

This would call the component's `logClickEvent` with the event object as the argument. As you might expect, you can also pass object properties or other arguments in the function invocation as well.

## Property bindings

Similar to the event bindings above, property bindings use the bracket notation `[<propertyName>]="${this.someProp}"`.

```html
<input type="text" id="username" name="username" [required]="${this.isRequired}" [value]="${this.username}">
```

## Component base

Templiteral exports a `Component` abstract class that provides a significant boilerplate for building custom elements. By utilizing the built-in static getter `boundAttributes` which returns an array of property names, you will keep your attribute and property vaules in sync.

If a bound attribute is a boolean value, the component supports a static getter `booleanAttributes`. Note that all boolean attributes must also be bound attributes.

If an attribute is also set inside the static `boundProps` array, it will be reflected inside the component itself. The state, property and attribute will all be bound together. A change to one will be reflected in the others.

In addition, `Component`'s render method will be called when any bound attribute changes. Along with the renderer, a new element method, `html` serves as an alias for `this.templiteral()`:

[See this demo on CodePen.](https://codepen.io/calebdwilliams/pen/qyOGJO?editors=1010#0)

```javascript
import { Component } from 'templiteral';

class HelloWorld extends Component {
  static get boundAttributes() { return ['who', 'now']; }

  constructor() {
    super();
    this.state = {
      who: this.getAttribute('who'),
      now: new Date().toLocaleString()
    };
    this.interval = setInterval(this.updateTime.bind(this), 100);
  }
  
  onDestroy() {
    window.clearInterval(this.interval);
  }
 
  updateTime() {
    this.now = new Date().toLocaleString();    
  }
 
  render() {
    this.html`
      <h1>Hello ${this.state.who}</h1>
      <p>${this.state.now}</p>
    `;
  }
}
 
customElements.define('hello-world', HelloWorld);
```

The `<hello-world who="world"></hello-world>` element would now have attributes in sync with the data and would automatically re-render the time every 100 milliseconds.

The `Component` base class also includes a custom event emitter utility simply called `emit`. `Component.emit` takes two arguments, the first is a string representing the `CustomEvent` name and the second is the detail object on the event for passing information outside of the component. [These events are, by default, composed](https://developer.mozilla.org/en-US/docs/Web/API/Event/Event) so they will bubble through barriers in the shadow DOM if one is attached.

[See this demo on CodePen.](https://codepen.io/calebdwilliams/pen/MBobmZ)

```javascript
import { Component } from 'templiteral';

class EmitExample extends Component {
  render() {
    this.html`
      <button (click)=${() => this.emit('button-clicked', new Date())}">Will emit an event called <code>button-clicked</code></button>`;
  }
}
```

One caveat to using `Component` is that the immediate renderer will not be called until all `boundAttributes` have been defined. Typically this should be done in the `constructor`, `connectedCallback` or `onInit`; however, when you override the `constructor`, `connectedCallback` or `disconnectedCallback` methods, make sure to call the method on `super` first to preserve functionality. `onInit` is a utility method that gets called when the component is done appending content to the DOM.

## Element references

Similar to React, you can create a simple element reference inside your template with the `ref` attribute: 

```html
<input type="text" id="username" ref="username">
```

and in your component file:

```javascript
this.username = this.refs.username.value;
```

If you intend to perform some action on element references, it is probably best to use the `onInit` lifecycle method described above.

## Property updated hooks

When a property is updated, often a developer will want to be notified. This is accomplished using the `Component.prototype.updatedHooks` API. `updatedHooks` is a [JavaScript Map object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map) that takes a property name and a callback function with the argument signature of `value: any, attributeName: string`. This callback _will not_ be called on the initial setting of the property value, but will be called on all subsequent calls to the property's setter.

```javascript
import { Component } from 'templiteral'; 
class MyEl extends Component {
  static get boundAttributes() { return ['title']; }
  constructor() {
    super();

    this.updatedHooks.set('title', this._titleUpdated);
  }

  render() { /** Omitted */ }

  _titleUpdated(newTitle, attributeName) {
    /** Omitted */
  }
}
```

### Array templates

Loops are created using the built-in `Array` prototype methods and the use of the `fragment` function. `fragment` takes in a unique key for each element in the array. Normally, the item's index should suffice, but in cases where there will be significant re-rendering, something else might be necessary.

```jsx
<ul>
  ${this.todos = todo => this.fragment(todo)`
    <li>
      <label>
        <input type="checkbox" (change)="${this.done}">
        ${todo.title}
      </label>
    </li>
  `}
</ul>
```

The fragment's `this` methods will still be referenced to the containing component.

## Conditional templates

To show/hide elements based on some condition, use the condition function. When used in a `Component`, you can use the element's built-in `if` method:

```html
${this.if(this.showTodos)`
  <ul>
    ${this.todos = todo => this.fragment(todo)`
      <li>
        <label>
          <input type="checkbox" (change)="${this.done}">
          ${todo.title}
        </label>
      </li>
    `}
  </ul>
`}
```

## Styling components

The previous method of styling components from version 3.x.x has been deprecated in favor of implementing the [constructible style sheets/adopted style sheets proposal](https://github.com/WICG/construct-stylesheets/blob/gh-pages/explainer.md). This package currently consumes the [construct style sheets polyfill](https://www.npmjs.com/package/construct-style-sheets-polyfill) to aid in styling components inside shadow roots.

```javascript
import { Component } from 'templiteral';

/** Construct a new style sheet */
const exampleStyles = new CSSStyleSheet();

/** Replace the contents of the style sheet */
exampleStyles.replace('* { color: tomato; }')
  .then(console.log);

class StyleExample extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    /** Adopt the style sheet */
    this.shadowRoot.adoptedStyleSheets = [exampleStyles];
  }

  render() {
    this.html`<h1>Hello world, this is tomato colored</h1>`;
  }
}
```