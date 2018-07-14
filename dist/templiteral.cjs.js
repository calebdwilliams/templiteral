'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

const valuePattern = /---!{.*?(}!---)/gi;
const eventPattern = /^\(.*\)$/gi;
const propPattern = /^\[.*\]$/;
const sanitizePattern = /^this\./;
const startSeparator = /---!\{/gi;
const endSeparator = /\}!---/gi;
const modelPattern = /t-model/gi;

const modelSymbol = Symbol('t-model');

class ContentNode {
  constructor(node, compiler) {
    this.node = node;
    this.compiler = compiler;
    this.base = node.nodeValue || '';
    this.indicies = this.base
      .match(valuePattern)
      .map(index => +index.replace(startSeparator, '').replace(endSeparator, ''));
    
    this.indicies.forEach(index => this.compiler.partIndicies.set(index, this));
  }

  set value(_value) {
    const newValue = this.base.replace(valuePattern, _value);
    this.value !== newValue ?
      this.node.nodeValue = newValue : null;
  }

  get value() {
    return this.node.nodeValue;
  }

  setValue(values = []) {
    this.node.nodeValue = this.base.replace(/---!{*.}!---/g, (match) => 
      values[+match.replace(startSeparator, '').replace(endSeparator, '')]
    );
  }

  update(values) {
    this.node.nodeValue = this.base.replace(/---!{*.}!---/g, match => {
      const value = values[+match.replace(startSeparator, '').replace(endSeparator, '')];
      return value === null ? '' : value;
    });
  }
}

class AttributeNode {
  constructor(node, boundAttrs, boundEvents, context, compiler) {
    this.node = node;
    this.boundAttrs = boundAttrs;
    this.boundEvents = boundEvents;
    this.context = context;
    this.compiler = compiler;
    this.boundAttrs.forEach(attribute => {
      attribute.base = attribute.value;
      const indicies = attribute.base.match(valuePattern) || [];
      this.indicies = indicies.map(index => +index.replace(startSeparator, '').replace(endSeparator, ''));
      this.indicies.forEach(index => this.compiler.partIndicies.set(index, this));
    });
    
    this.addListeners();
  }

  addListeners() {
    this.boundEvents.forEach((eventHandler, eventName) => {
      if (eventName === modelSymbol) {
        this.context[eventHandler] = this.context[eventHandler] ? this.context[eventHandler] : undefined;
        this.node.value = this.context[eventHandler];
        this.node.addEventListener('input', this._modelFunction(eventHandler));
        this.node.addEventListener('change', this._modelFunction(eventHandler));        
      } else {
        const events = eventHandler.split(/;/);
        const eventsSafe = events.filter(event => event.match(sanitizePattern));
        const sanitizedEvents = eventsSafe.join('; ');
        if (eventHandler.match(sanitizePattern)) {
          const handler = Reflect.construct(Function, ['event', sanitizedEvents]).bind(this.context);
          this.node.addEventListener(eventName, handler);
          this.node._boundEvents = handler;
        }

        if (eventsSafe.length < events.length) {
          console.warn('Inline functions not allowed inside of event bindings. Unsafe functions have been removed from node', this.node);
        }
      }
    });
  }

  updateProperty(attribute, attributeValue) {
    const attributeName = attribute.name.replace(/\[|\]/g, '');
    this.node[attributeName] = attributeValue;
    if (attributeValue && (attributeValue !== 'false' && attributeValue !== 'undefined')) {
      this.node.setAttribute(attributeName, attributeValue);
    } else {
      this.node[attributeName] = false;
      this.node.removeAttribute(attributeName);
    }
  }

  update(values) {
    this.boundAttrs.forEach(attribute => {
      const bases = attribute.base.match(/---!{*.}!---/g) || [];
      const baseIndicies = bases.map(base => +base.replace('---!{', '').replace('}!---', ''));
      let attributeValue = attribute.base;

      if (baseIndicies.length === 1) {
        attributeValue = attributeValue.replace(`---!{${baseIndicies[0]}}!---`, values[baseIndicies[0]]);
      } else if (baseIndicies.length > 1) {
        for (let i = 0; i < baseIndicies.length; i += 1) {
          const value = values[baseIndicies[i]] || '';
          attributeValue = attributeValue.replace(`---!{${baseIndicies[i]}}!---`, value);
        }
      }
      
      attribute.value = attributeValue;
      if (attribute.name.match(propPattern)) {
        if (baseIndicies.length === 1) {
          attributeValue = values[baseIndicies[0]];
        }
        this.updateProperty(attribute, attributeValue);
      }
    });
  }

  _modelFunction(modelName) {
    const { context } = this;
    return function() {
      context[modelName] = this.value;
    };
  }
}

class Template {
  constructor(strings, values, location, context) {
    this.strings = strings;
    this.values = values;
    this.oldValues = values.map((value, index) => `---!{${index}}!---`);
    this.location = location;
    this.context = context;
    this.parts = [];
    this.partIndicies = new Map();
    this.context.$el = location;
    
    this.eventHandlers = [];
    this._init();
  }

  _append(node) {
    for (let i = 0; i < this.parts.length; i += 1) {
      const part = this.parts[i];
      if (part instanceof ContentNode) {
        part.setValue(this.values, this.oldValues[i]);
      } else if (part instanceof AttributeNode) {
        part.update(this.values, this.oldValues);
      }
    }

    this.location.appendChild(node);
  }

  _init() {
    const base = this.strings.map((string, index) =>
      `${string ? string : ''}${this.values[index] !== undefined ? '---!{' + index + '}!---' : ''}`
    ).join('');
    const fragment = document.createElement('template');
    fragment.innerHTML = base;
    const baseNode = document.importNode(fragment.content, true);

    const walker = document.createTreeWalker(baseNode, 133, null, false);
    this._walk(walker, this.parts, true);
    this._append(baseNode);
  }

  _walk(walker, parts) {
    this.context.refs = this.context.refs || {};
    while (walker.nextNode()) {
      const { currentNode } = walker;
      if (!currentNode.__templiteralCompiler) {
        switch (currentNode.nodeType) {
        case 1: {
          const { attributes } = currentNode;
          if (attributes.length) {
            const boundAttrs = new Map();
            const boundEvents = new Map();
            for (let i = 0; i < attributes.length; i += 1) {
              const attribute = attributes[i];
              if (attribute.value.match(valuePattern) || attribute.name.match(propPattern)) {
                boundAttrs.set(attribute.name, attribute);
              } else if (attribute.name.match(eventPattern)) {
                const eventName = attribute.name.substring(1, attribute.name.length - 1);
                boundEvents.set(eventName, attribute.value);
                this.eventHandlers.push({ eventName, currentNode });
              } else if (attribute.name.match(modelPattern)) {
                boundEvents.set(modelSymbol, attribute.value);
              } else if (attribute.name.match('ref')) {
                this.context.refs[attribute.value] = currentNode;
                console.dir(this.context);
              }
            }
            if (boundAttrs.size >= 1 || boundEvents.size >= 1) {
              const attrNode = new AttributeNode(currentNode, boundAttrs, boundEvents, this.context, this);
              parts.push(attrNode);
            }
          }
          break;
        }
        case 3: {
          if (currentNode.textContent && currentNode.textContent.match(valuePattern)) {
            const contentNode = new ContentNode(currentNode, this);
            parts.push(contentNode);
          }
          break;
        }
        }
      } else {
        this.templiteralParts.add(currentNode);
      }
    }
  }

  update(values) {
    this.oldValues = this.values;
    this.values = values;

    for (let i = 0; i < values.length; i += 1) {
      if (values[i] !== this.oldValues[i]) {
        window.requestAnimationFrame(() => 
          this.partIndicies.get(i).update(values)
        );
      }
    }
  }
}

class TRepeat extends HTMLElement {
  constructor() {
    super();
    this.templiteral = templiteral;
  }

  connectedCallback() {
    this._render();
  }

  _render() {
    this.templiteral()(this.items.map(this.templatecallback()));
  }
}

if (!customElements.get('t-repeat')) {
  customElements.define('t-repeat', TRepeat);
}

class TIf extends HTMLElement {  
  constructor() {
    super();
    this.cached = [];
  }
  
  connectedCallback() {
    this.style.display = 'contents';  
  }
    
  set condition(condition) {
    if (condition === false) {
      Array.from(this.children).map(child => {
        this.cached.push(child);
        this.removeChild(child);
      });
      this.innerHTML = '';
    } else if (condition === true) {
      this.cached.forEach(child => this.appendChild(child));
      this.cached = [];
    }
  }
}
  
if (!customElements.get('t-if')) {
  customElements.define('t-if', TIf);
}

const templateCache = new WeakMap();

function templiteral(location = this, context = this) {
  location.shadowRoot ? location = location.shadowRoot : null;

  return (strings, ...values) => {
    let compiler = templateCache.get(location);

    if (compiler) {
      compiler.update(values);
    } else {
      compiler = new Template(strings, values, location, context);
      templateCache.set(location, compiler);
    }
    
    return compiler;
  };
}

class Component extends HTMLElement {
  static get boundAttributes() {
    return [];
  }
  
  static get observedAttributes() {
    return [...this.boundAttributes];
  }
  
  constructor() {
    super();
    const self = this;
    this.constructor.boundAttributes.forEach(attr => {
      Object.defineProperty(this, attr, {
        get() {
          return this.getAttribute(attr);
        },
        set(_attr) {
          if (_attr) {
            this.setAttribute(attr, _attr);
          } else {
            this.removeAttribute(attr);
          }
          if (this.constructor.renderer && typeof this[this.constructor.renderer] === 'function') {
            this[this.constructor.renderer]();
          }
        }
      });
    });
    
    Object.defineProperty(this, 'templiteral', {
      get() {
        const location = self.shadowRoot ? self.shadowRoot : self;
        return templiteral(self, location);
      },
      enumerable: false,
      configurable: false
    });
    
    Object.defineProperty(this, 'html', {
      enumerable: false,
      get() {
        return (...args) => {
          window.requestAnimationFrame(() => Reflect.apply(self.templiteral, self, args));
        }
      }
    });
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue !== newValue) {
      this[name] = newValue;
    }
  }
  
  connectedCallback() {
    if (this.constructor.renderer && typeof this[this.constructor.renderer] === 'function') {
      this[this.constructor.renderer]();
    }
  }
  
  disconnectedCallback() {
    templateCache.delete(this);
  }
}

exports.templiteral = templiteral;
exports.Component = Component;
