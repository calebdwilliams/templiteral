const valuePattern = /---!{.*?(}!---)/gi;
const eventPattern = /^\(.*\)$/gi;
const propPattern = /^\[.*\]$/;



const modelPattern = /t-model/gi;

const modelSymbol = Symbol('t-model');
const removeSymbol = Symbol('RemoveTemplate');
const rendererSymbol = Symbol('Renderer');

const valueToInt = match => +match.replace(/(---!{)|(}!---)/gi, '');
const toEventName = match => match.replace(/(\()|(\))/gi, '');

class ContentNode {
  constructor(node, compiler) {
    this.node = node;
    this.compiler = compiler;
    this.base = node.nodeValue || '';
    this.indicies = this.base
      .match(valuePattern)
      .map(valueToInt);
    
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
      values[valueToInt(match)]
    );
  }

  update(values) {
    this.node.nodeValue = this.base.replace(/---!{*.}!---/g, match => {
      const value = values[valueToInt(match)];
      if (Array.isArray(value)) {
        return value.join('');
      } else {
        return value === null ? '' : value;
      }
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
      this.indicies = indicies.map(valueToInt);
      this.indicies.forEach(index => this.compiler.partIndicies.set(index, this));
    });
    this.eventMap = new Map();
    this.addListeners();
  }

  addListener(eventName, method) {
    this.node.addEventListener(eventName, method.bind(this.context));
    this.eventMap.set(eventName, method);
    !this.context.DEBUG ? this.node.removeAttribute(`(${eventName})`) : null;
  }

  addListeners() {
    this.boundEvents.forEach((eventHandler, eventName) => {
      if (eventName === modelSymbol) {
        this.context[eventHandler] = this.context[eventHandler] ? this.context[eventHandler] : undefined;
        this.node.value = this.context[eventHandler];
        this.node.addEventListener('input', this._modelFunction(eventHandler));
        this.node.addEventListener('change', this._modelFunction(eventHandler));
      } else {
        if (typeof eventHandler === 'function') {
          this.addListener(eventName, eventHandler);
        } else {
          const handlerName = eventHandler.replace(/(this\.)|(\(.*\))/gi, '');
          if (typeof this.context[handlerName] !== 'function') {
            console.error(`Method ${handlerName} is not a method of element ${this.context.tagName}`);
          } else {
            const handler = this.context[handlerName].bind(this.context);
            this.addListener(eventName, handler);
          }
        }
      }
    });
  }

  disconnect() {
    if (this.eventMap.size) {
      this.eventMap.forEach((eventHandler, eventName, eventMap) => {
        this.node.removeEventListener(eventName, eventHandler);
        eventMap.delete(eventName);
      });
    }
  }

  updateProperty(attribute, attributeValue) {
    const attributeName = attribute.name.replace(/\[|\]/g, '');
    !this.context.DEBUG ? this.node.removeAttribute(attribute.name) : null;
    this.node[attributeName] = attributeValue;
    if (attributeName === 'innerhtml') {
      this.node.innerHTML = attributeValue.join('');
      this.node.removeAttribute('innerhtml');
      this.node.removeAttribute('innerHTML');
    }
    if (attributeValue && (attributeValue !== 'false' && attributeValue !== 'undefined')) {
      this.node.setAttribute(attributeName, attributeValue);
    } else {
      this.node[attributeName] = false;
      this.node.removeAttribute(attributeName);
    }
  }

  update(values) {
    this.boundAttrs.forEach(attribute => {
      const bases = attribute.base.match(/---!{\d+}!---/gi) || [];
      const baseIndicies = bases.map(valueToInt);
      let attributeValue = attribute.base;
      
      for (let i = 0; i < baseIndicies.length; i += 1) {
        const index = baseIndicies[i];
        const value = values[index] || '';
        if (typeof value !== 'function') {
          attributeValue = attributeValue.replace(`---!{${index}}!---`, value);
        } else {
          this.addListener(toEventName(attribute.name), value);
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

// import { templiteral } from './templiteral';
class DirectiveNode {
  constructor(node, value, context, compiler, index) {
    this.node = node;
    this.values = value;
    this.context = context;
    this.compiler = compiler;
    this.index = index;
    this.templateMap = new Map();
    this.compiler.partIndicies.set(index, this);
  }

  init() {
    this.templates = this.values.map(value => {
      const $$key = value[1].$$key;
      let template;
      if (this.templateMap.has($$key)) {
        template = this.templateMap.get($$key);
      } else {
        template = new Template(value[0], value[1], this.node.parentNode, this.context);
        this.templateMap.set($$key, template);
      }
      return template;
    });
  }

  update(values) {
    const newValues = values[this.index];
    const oldValues = this.values;
    this.values = newValues;
    const activeKeys = new Set(this.values.map(value => value[1].$$key));
    const previousKeys = new Set(oldValues.map(value => value[1].$$key));

    if (activeKeys.size < previousKeys.size) {
      activeKeys.forEach(key => previousKeys.delete(key));
      previousKeys.forEach(key => {
        const template = this.templateMap.get(key);
        template[removeSymbol]();
        this.templateMap.delete(key);
      });
    }

    if (newValues.length !== oldValues.length) {
      this.init();
    } else {
      this.templates.forEach((template, index) => {
        template.update(values[this.index][index][1]);
      });
    }
  }
}

class Template {
  constructor(strings, values, location, context) {
    this.strings = strings;
    this.values = values;
    this.oldValues = values.map((value, index) => `---!{${index}}!---`);
    this.location = location;
    this.context = context;
    this.context.refs = this.context.refs || {};
    this.parts = [];
    this.partIndicies = new Map();
    this.context.$el = location;
    this.templateSymbol = Symbol('Template');
    this.eventHandlers = [];
    this.nodes = [];
    this._init();
  }

  _append(node) {
    for (let i = 0; i < this.parts.length; i += 1) {
      const part = this.parts[i];
      if (part instanceof ContentNode) {
        part.setValue(this.values, this.oldValues[i]);
      } else if (part instanceof AttributeNode) {
        part.update(this.values, this.oldValues);
      } else if (part instanceof DirectiveNode) {
        part.init();
      }
    }
    const symbol = this.templateSymbol;
    this.nodes = Array.from(node.children).map(child => {
      child[symbol] = true;
      return child;
    });
    this.location.appendChild(node);

    if (!this.context[rendererSymbol]) {
      Object.defineProperty(this, rendererSymbol, {
        value: this,
        enumerable: false,
        configurable: false,
        writable: false
      });

      this.context.onInit && typeof this.context.onInit === 'function' && this.context.onInit();
    }
  }

  _init() {
    const _base = this.strings.map((string, index) => {
      const value = this.values[index];
      const interpolationValue = `---!{${index}}!---`;
      let output = '';
      output += string ? string : '';
      if (value !== undefined && !Array.isArray(value)) {
        output += interpolationValue;
      } else if (value !== undefined && Array.isArray(value)) {
        output += `<!-- ${interpolationValue} -->`;
      }
      return output;
    }).join('');
    const fragment = document.createElement('template');
    fragment.innerHTML = _base;
    const baseNode = document.importNode(fragment.content, true);

    const walker = document.createTreeWalker(baseNode, 133, null, false);
    this._walk(walker, this.parts, true);
    this._append(baseNode);
  }

  _walk(walker, parts) {
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
                if (!attribute.value.match(valuePattern)) {
                  const eventName = attribute.name.substring(1, attribute.name.length - 1);
                  boundEvents.set(eventName, attribute.value);
                  this.eventHandlers.push({ eventName, currentNode });
                } else if (attribute.value.match(valuePattern)) {
                  const eventName = attribute.name.substring(1, attribute.name.length - 1);
                  const handler = this.values[valueToInt(attribute.value)];
                  boundEvents.set(eventName, handler);
                  this.eventHandlers.push({ eventName, currentNode });
                }
              } else if (attribute.name.match(modelPattern)) {
                boundEvents.set(modelSymbol, attribute.value);
              } else if (attribute.name.match('ref')) {
                this.context.refs[attribute.value] = currentNode;
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
        case 8: {
          const valuesPart = valueToInt(currentNode.nodeValue);
          const initial = this.values[valuesPart];
          const value = this.values[valuesPart];
          const directiveNode = new DirectiveNode(currentNode, value, this.context, this, valuesPart, initial);
          parts.push(directiveNode);
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

  [removeSymbol]() {
    this.nodes.forEach(templateChild => this.location.removeChild(templateChild));
    this.parts
      .filter(part => part instanceof AttributeNode)
      .forEach(part => part.disconnect());
  }
}

class TRepeat extends HTMLElement {
  constructor() {
    super();
    this.templiteral = templiteral;
  }

  connectedCallback() {
    console.warn('t-repeat is being deprecated in favor of inline array methods.');
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

    if (compiler && strings === compiler.strings) {
      compiler.update(values);
    } else if (compiler) {
      [...compiler.location.children].forEach(child => compiler.location.removeChild(child));
      compiler = new Template(strings, values, location, context);
      templateCache.set(location, compiler);
    } else {
      compiler = new Template(strings, values, location, context);
      templateCache.set(location, compiler);
    }
    
    return compiler;
  };
}

function fragment(key) {
  return (strings, ...values) => {
    Object.defineProperty(values, '$$key', {
      value: key,
      enumerable: false,
      configurable: false,
      writable: false
    });
    return [strings, values];
  };
}

class Component extends HTMLElement {
  static get boundAttributes() {
    return [];
  }

  static get boundProps() {
    return [];
  }
  
  static get observedAttributes() {
    return [...this.boundAttributes];
  }

  static get renderer() {
    return 'render';
  }
  
  constructor() {
    super();
    const self = this;
    const attrs = new Set();
    this.constructor.boundAttributes.map((attr, index, currentArray) => {
      Object.defineProperty(this, attr, {
        get() {
          return this.getAttribute(attr) || this.hasAttribute(attr);
        },
        set(_attr) {
          if (_attr || _attr === '') {
            this.setAttribute(attr, _attr);
          } else {
            this.removeAttribute(attr);
          }
          if (this.constructor.renderer && typeof this[this.constructor.renderer] === 'function' && this.isConnected && attrs.size === currentArray.length) {
            this[this.constructor.renderer]();
          }
          attrs.add(attr);
        }
      });
    });
    
    Object.defineProperty(this, 'templiteral', {
      get() {
        const location = self.shadowRoot ? self.shadowRoot : self;
        return templiteral(location, self);
      },
      configurable: false,
      enumerable: false
    });
    
    Object.defineProperty(this, 'html', {
      get() {
        return (...args) => {
          return new Promise(resolve => 
            window.requestAnimationFrame(() => resolve(Reflect.apply(self.templiteral, self, args)))
          );
        };
      },
      configurable: false,
      enumerable: false
    });

    Object.defineProperty(this, 'fragment', {
      value: fragment,
      configurable: false,
      enumerable: false,
      writable: false
    });
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue !== newValue) {
      this[name] = newValue;
    } else if (newValue === '' && this.hasAttribute(name)) {
      this[name] = true;
    }
  }
  
  connectedCallback() {
    if (this.constructor.renderer && typeof this[this.constructor.renderer] === 'function') {
      this[this.constructor.renderer]();

      this.addEventListener('ComponentRender', () => {
        setTimeout(this[this.constructor.renderer].bind(this), 0);
      });
    }

    if (this[this.constructor.renderer] && this.constructor.boundProps.length) {
      this.constructor.boundProps.map(prop => {
        this[prop] = watch(this[prop], () => {
          const renderEvent = new CustomEvent('ComponentRender', {
            bubbles: true,
            composed: true,
            detail: {
              component: this,
              time: Date.now(),
            }
          });
          this.dispatchEvent(renderEvent);
          return this[this.constructor.renderer].bind(this);
        });
      });
    }
  }
  
  disconnectedCallback() {
    templateCache.delete(this);
    if (this.constructor.renderer && typeof this[this.constructor.renderer] === 'function') {
      this.removeEventListener('ComponentRender', this[this.constructor.renderer]);
    }
    this[rendererSymbol][removeSymbol]();
  }

  emit(eventName, detail) {
    this.dispatchEvent(new CustomEvent(eventName, { detail }));
  }
}

const watch = (object, onChange) => {
  const handler = {
    get(target, property, receiver) {
      const desc = Object.getOwnPropertyDescriptor(target, property);
      const value = Reflect.get(target, property, receiver);

      if (desc && !desc.writable && !desc.configurable && property !== 'push') {
        return value;
      }

      try {
        return new Proxy(target[property], handler);
      } catch (err) {
        return Reflect.get(target, property, receiver);
      }
    },
    defineProperty(target, property, descriptor) {
      onChange();
      return Reflect.defineProperty(target, property, descriptor);
    },
    deleteProperty(target, property) {
      onChange();
      return Reflect.deleteProperty(target, property);
    }
  };

  return new Proxy(object, handler);
};

export { templiteral, fragment, Component, watch };
