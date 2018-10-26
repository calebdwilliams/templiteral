const valuePattern = /---!{.*?(}!---)/gi;

const propPattern = /^\[.*\]$/;



const matchPattern = /---!{\d+}!---/gi;
const removeSymbol = Symbol('RemoveTemplate');
const rendererSymbol = Symbol('Renderer');
const repeaterSymbol = Symbol('Repeater');
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

  update(values) {
    this.node.nodeValue = this.base.replace(matchPattern, match => {
      const value = values[valueToInt(match)];
      return value === null ? '' : values[valueToInt(match)];
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
      attribute.bases = attribute.base.match(matchPattern) || [];
      attribute.baseIndicies = attribute.bases.map(valueToInt);
      attribute.cleanName  = attribute.name.replace(/\[|\]/g, '') ;
      const indicies = attribute.base.match(valuePattern) || [];
      this.indicies = indicies.map(valueToInt);
      this.indicies.forEach(index => this.compiler.partIndicies.set(index, this));
    });
    this.eventMap = new Map();
  }

  addListener(eventName, method) {
    if (!this.eventMap.get(eventName)) {
      this.node.addEventListener(eventName, method.bind(this.context));
      this.eventMap.set(eventName, method);
      !this.context.DEBUG ? this.node.removeAttribute(`(${eventName})`) : null;
    }
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
    const attributeName = attribute.cleanName;
    !this.context.DEBUG ? this.node.removeAttribute(attribute.name) : null;
    this.node[attributeName] = attributeValue;
    if (attributeValue && (attributeValue !== 'false' && attributeValue !== 'undefined')) {
      this.node.setAttribute(attributeName, attributeValue);
    } else {
      // this.node[attributeName] = false;
      this.node.removeAttribute(attributeName);
    }
  }

  update(values) {
    this.boundAttrs.forEach(attribute => {
      let attributeValue = attribute.base;
      
      for (let i = 0; i < attribute.baseIndicies.length; i += 1) {
        const index = attribute.baseIndicies[i];
        const value = values[index] || '';
        if (typeof value !== 'function') {
          attributeValue = attributeValue.replace(`---!{${index}}!---`, value);
        } else {
          this.addListener(toEventName(attribute.name), value);
          this.boundAttrs.delete(attribute.name);
        }
      }
      
      attribute.value = attributeValue;
      if (attribute.name.match(propPattern)) {
        if (attribute.baseIndicies.length === 1) {
          attributeValue = values[attribute.baseIndicies[0]];
        }
        this.updateProperty(attribute, attributeValue);
      }
    });
  }
}

const deepEqual = (a, b) => {
  if (a === b) return true;
    
  if (a && b && typeof a == 'object' && typeof b == 'object') {
    const arrA = Array.isArray(a);
    const arrB = Array.isArray(b);
    let i;
    let length;
    let key;
        
    if (arrA && arrB) {
      length = a.length;
      if (length != b.length) return false;
      for (i = length; i-- !== 0;)
        if (!deepEqual(a[i], b[i])) return false;
      return true;
    }
        
    if (arrA != arrB) return false;
        
    const dateA = a instanceof Date;
    const dateB = b instanceof Date;
    if (dateA != dateB) return false;
    if (dateA && dateB) return a.getTime() == b.getTime();
        
    const regexpA = a instanceof RegExp;
    const regexpB = b instanceof RegExp;
    if (regexpA != regexpB) return false;
    if (regexpA && regexpB) return a.toString() == b.toString();
        
    const keys = Object.keys(a);
    length = keys.length;
        
    if (length !== Object.keys(b).length) return false;
        
    for (i = length; i-- !== 0;)
      if (!Object.hasOwnProperty.call(b, keys[i])) return false;

    for (i = length; i-- !== 0;) {
      key = keys[i];
      if (!deepEqual(a[key], b[key])) return false;
    }

    return true;
  } else if (a && b && typeof a == 'function' && typeof b == 'function') {
    // ignore functions for our purposes
    return true;
  }
    
  return a!==a && b!==b;
};

class DirectiveNode {
  constructor(node, value, context, compiler, index) {
    this.node = node;
    this.values = value;
    this.context = context;
    this.compiler = compiler;
    this.index = index;
    this.templateMap = null;
    this.compiler.partIndicies.set(index, this);
    this.node[repeaterSymbol] = [];
    this.repeater = this.node[repeaterSymbol];
    this.group = Symbol('Group');
  }

  init() {
    this.templates = this.values.map((value, index) => {
      const [strings, values] = value;
      const { $$key } = values;
      if (this.templateMap === null) {
        if (typeof $$key !== 'string' && typeof $$key !== 'number') {
          this.templateMap = new WeakMap();
        } else {
          this.templateMap = new Map();
        }
      }
      let template;
      if (this.templateMap.has($$key)) {
        template = this.templateMap.get($$key);
        template.update(values);
      } else {
        template = new Template(strings, values, this.node, this.context, this.group, index);
        this.templateMap.set($$key, template);
      }
      this.node[this.group].set(index, template);
      this.repeater.push(...template.nodes);
      return template;
    });
  }

  update(values) {
    const newValues = values[this.index];
    const oldValues = this.values;
    this.values = newValues;
    const activeKeys = new Set(this.values.map(([, value]) => value.$$key));
    const previousKeys = new Set(oldValues.map(([, value]) => value.$$key));
    const newKeys = new Set();

    activeKeys.forEach(key => {
      previousKeys.has(key) ? null : newKeys.add(key);
    });

    previousKeys.forEach(key => {
      const template = this.templateMap.get(key);
      if (template && !activeKeys.has(key)) {
        template[removeSymbol]();
        this.templateMap.delete(key);
      }
    });
    this.init();
  }
}

class Template {
  constructor(strings, values, location, context, group = null, index = null) {
    this.strings = strings;
    this.values = values;
    this.oldValues = values.map((value, index) => `---!{${index}}!---`);
    this.location = location;
    this.context = context;
    this.group = group;
    this.index = index;
    this.context.refs = this.context.refs || {};
    this.parts = [];
    this.partIndicies = new Map();
    this.context.$el = location;
    this.templateSymbol = Symbol('Template');
    this.nodes = [];
    this._init();
  }

  _append(node) {
    this.nodes = Array.from(node.children).map(child => {
      child[this.templateSymbol] = this;
      return child;
    });

    if (this.location instanceof Comment) {
      if (this.group) {
        this.location[this.group] = this.location[this.group] || new Map();
        let group = this.location[this.group];
        this.location[this.group].set(this.index, this);
        if (this.index === 0) {
          this.location.after(node);
        } else {
          let appendIndex = this.index - 1;
          while (!group.get(appendIndex)) {
            appendIndex -= 1;
          }
          group.get(appendIndex).nodes[group.get(this.index - 1).nodes.length - 1].after(node);
        }
      }
    } else {
      this.location.appendChild(node);
    }

    if (!this.context[rendererSymbol]) {
      Object.defineProperty(this, rendererSymbol, {
        value: this,
        enumerable: false,
        configurable: false,
        writable: false
      });
    }
  }

  _createBase() {
    return this.strings.map((string, index) => {
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
  }

  _createNode(baseText) {
    const fragment = document.createElement('template');
    fragment.innerHTML = baseText;
    return document.importNode(fragment.content, true);
  }

  _init() {
    const base = this._createBase();
    const baseNode = this._createNode(base);
    const walker = document.createTreeWalker(baseNode, 133, null, false);
    this._walk(walker, this.parts, true);
    this._append(baseNode);
  }

  _walk(walker, parts) {
    while (walker.nextNode()) {
      const { currentNode } = walker;
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
            } else if (attribute.name.match('ref')) {
              this.context.refs[attribute.value] = currentNode;
            }
          }
          if (boundAttrs.size >= 1 || boundEvents.size >= 1) {
            const attrNode = new AttributeNode(currentNode, boundAttrs, boundEvents, this.context, this);
            parts.push(attrNode);
            attrNode.update(this.values, this.oldValues);
          }
        }
        break;
      }
      case 3: {
        if (currentNode.textContent && currentNode.textContent.match(valuePattern)) {
          const contentNode = new ContentNode(currentNode, this);
          parts.push(contentNode);
          contentNode.update(this.values, this.oldValues);
        }
        break;
      }
      case 8: {
        const valuesPart = valueToInt(currentNode.nodeValue);
        const initial = this.values[valuesPart];
        const value = this.values[valuesPart];
        const directiveNode = new DirectiveNode(currentNode, value, this.context, this, valuesPart, initial);
        parts.push(directiveNode);
        directiveNode.init(this.values[parts.length - 1]);
        break;
      }
      }
    }
  }

  update(values) {
    this.oldValues = this.values;
    this.values = values;
    
    for (let i = 0; i < values.length; i += 1 ) {
      const part = this.partIndicies.get(i);
      part && !deepEqual(values[i], this.oldValues[i]) && 
        part.update(values);
    }
  }

  [removeSymbol]() {
    this.nodes.forEach(templateChild => templateChild.parentNode.removeChild(templateChild));
    this.nodes = null;
    this.parts
      .filter(part => part instanceof AttributeNode)
      .forEach(part => part.disconnect());
    this.parts = null;
    this.partIndicies = null;
    this.context = null;
    this.location = null;
    this.group = null;
  }
}

class StyleSheetRegistry {
  constructor() {      
    this.adopters = new WeakMap();
    this.registry = new Map();
    this.observer = new MutationObserver(mutationsList => {
      mutationsList.forEach(mutation => {
        [...mutation.removedNodes].forEach(node => {
          if (this.adopters.has(node)) {
            this.adopters.delete(node);
          } else if (this.adopters.has(node.shadowRoot)) {
            this.adopters.delete(node.shadowRoot);
          }
        });
      });
    });
    
    this.observer.observe(document.body, {
      childList: true
    });
    
    this._error = Symbol('error');
    this._pending = Symbol('pending');
    
    this.pending = new Set();
  }

  adopt(node, name) {
    const fromNode = this.adopters.get(node) || new Map();
    if (!fromNode.size) {
      this.adopters.set(node, fromNode);
    }
    if (!fromNode.has(name) && this.get(name) !== this._pending) {
      const sheet = this.get(name);
      node.appendChild(sheet);
      fromNode.set(name, sheet);
      return Promise.resolve(sheet);
    } else if (this.get(name) === this._pending) {
      return new Promise((resolve, reject) => {
        const interval = window.setInterval(() => {
          if (this.get(name)) {
            const sheet = this.get(name);
            if (sheet !== this._error && sheet !== this._pending) {
              node.appendChild(sheet);
              fromNode.set(name, sheet);
              resolve(sheet);
              window.clearInterval(interval);
            } else if (sheet === this._error) {
              reject();
              window.clearInterval(interval);
            }
          }
        }, 200);
      });
    } else {
      return Promise.resolve(fromNode.get(name));
    }
  }

  createSheet(textContent) {
    const sheet = document.createElement('style');
    sheet.textContent = textContent;
    return sheet;
  }

  define(name, value) {
    this.registry.set(name, value);
    return Promise.resolve({name});
  }

  get(name) {
    if (this.registry.get(name)) {
      const cssText = this.registry.get(name);
      if (cssText === this._pending || cssText === this._error) {
        return cssText;
      }
      return this.createSheet(cssText);  
    } else {
      throw new Error(``)
    }
  }
  
  load(name, url, config) {
    this.registry.set(name, this._pending);
    return fetch(url, config)
      .then(response => response.text())
      .then(styleText => {
        this.define(name, styleText);
        return name;
      })
      .catch(error => {
        this.define(name, this._error);
      });
  }
}

const templateCache = new WeakMap();
const styleRegistry = new StyleSheetRegistry();

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

function condition(bool) {
  return (strings, ...values) => {
    Object.defineProperty(values, '$$key', {
      value: bool ? 'condition' : 'false',
      enumerable: false,
      configurable: false,
      writable: false
    });
    return bool ? [[strings, values]] : [[[], values]];
  };
}

class Component extends HTMLElement {
  static get styles() { return styleRegistry; }
  static get defineStyles() { return this.styles.define.bind(styleRegistry); }
  static get hasStyles() { return this.styles.registry.has.bind(styleRegistry.registry); }
  static get loadStyles() { return this.styles.load.bind(styleRegistry); }
  static get adoptStyles() { return this.styles.adopt.bind(styleRegistry); }
  static get boundAttributes() { return []; }
  static get boundProps() { return []; }
  static get observedAttributes() { return [...this.boundAttributes]; }
  static get booleanAttributes() { return []; }
  static get renderer() { return 'render'; }
  
  setState(stateAmmend = {}) {
    Object.entries(stateAmmend).forEach(([key, value]) => {
      if (this.constructor.booleanAttributes.includes(key)) {
        value = value === '' ? true : !!value;
      }
      if (this.constructor.boundProps.includes(key)) {
        this[key] = value;
      }
      this.state[key] = value;
    });
    this[this.constructor.renderer]();
  }

  constructor(init) {
    super();
    if (init) {
      this.attachShadow(init);
    }
    const state = {};
    const self = this;
    const attrs = new Set();

    Object.defineProperty(this, 'state', {
      get() {
        return state;
      },
      set(_state) {
        Object.entries(_state).forEach(([key, value]) => {
          if (typeof _state[key] !== 'object' || !value) {
            state[key] = value;
          } else if (value) {
            state[key] = watch(value, () => this[this.constructor.renderer]());
          }
        });
      }
    });

    this.constructor.boundAttributes.map((attr, index, currentArray) => {
      Object.defineProperty(this, attr, {
        get() {
          if (this.constructor.booleanAttributes.includes(attr)) {
            return this.hasAttribute(attr);
          }
          return this.getAttribute(attr);
        },
        set(value) {
          if (this.constructor.booleanAttributes.includes(attr)) {
            if (value || value === '') {
              this.setAttribute(attr, true);
            } else {
              this.removeAttribute(attr);
            }
          } else {
            if (value) {
              this.setAttribute(attr, value);
            } else {
              this.removeAttribute(attr);
            }
          }
          if (this.constructor.boundProps.includes(name)) {
            this[name] = value;
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
        return (...args) => Reflect.apply(self.templiteral, self, args);
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

    Object.defineProperty(this, 'if', {
      value: condition,
      configurable: false,
      enumerable: false,
      writable: false
    });
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (this.constructor.booleanAttributes.includes(name) && oldValue !== newValue) {
      newValue = newValue === '' ? true : newValue;
      this.setState({ [name]: !!newValue });
      if (this.constructor.boundProps.includes(name)) {
        this[name] = !!newValue;
      }
    } else if (oldValue !== newValue) {
      this.setState({ [name]: newValue });
      if (this.constructor.boundProps.includes(name)) {
        this[name] = newValue;
      }
    }
    this.emit('ComponentRender', {
      component: this,
      time: Date.now(),
    });
  }

  get $$renderListener() {
    return this[this.constructor.renderer];
  }
  
  connectedCallback() {
    if (this.constructor.renderer && typeof this[this.constructor.renderer] === 'function') {
      this[this.constructor.renderer]();

      if (!this.$$listening) {
        this.addEventListener('ComponentRender', this.$$renderListener);
      }
    }

    if (this.constructor.hasStyles(this.tagName.toLowerCase())) {
      this.constructor.adoptStyles(this.shadowRoot ? this.shadowRoot : this, this.tagName.toLowerCase());
    }
    
    this.$$listening = true;
    this.onInit();
  }
  
  disconnectedCallback() {
    templateCache.delete(this);
    if (this.constructor.renderer && typeof this[this.constructor.renderer] === 'function') {
      this.removeEventListener('ComponentRender', this.$$renderListener);
      this.$$listening = false;
    }
    this[rendererSymbol] && this[rendererSymbol][removeSymbol]();
    this.onDestroy();
  }

  onInit() {}
  onDestroy() {}

  emit(eventName, detail) {
    this.dispatchEvent(new CustomEvent(eventName, { 
      bubbles: true,
      composed: true,
      detail 
    }));
  }
}

const debounce = (fn, wait, immediate) => {
  let timeout;

  return function executed(...args) {
    const context = this;
    
    const later = () => {
      timeout = null;
      !immediate && Reflect.apply(fn, context, args);
    };

    const callNow = immediate && !timeout;

    clearTimeout(timeout);

    timeout = setTimeout(later, wait);

    callNow && Reflect.apply(fn, context, args);
  };
};

const watch = (object, onChange) => {
  const handler = {
    get(target, property, receiver) {
      try {
        const desc = Object.getOwnPropertyDescriptor(target, property);
        const value = Reflect.get(target, property, receiver);
  
        if (desc && !desc.writable && !desc.configurable) {
          return value;
        }
        if (typeof target[property] === 'function' && (target instanceof Date || target instanceof Map ||target instanceof WeakMap)) {
          return new Proxy(target[property].bind(target), handler);
        }
        return new Proxy(target[property], handler);
      } catch (err) {
        if (target instanceof HTMLElement) {
          return target[property];
        }
        return Reflect.get(target, property, receiver);
      }
    },
    set(target, property, value) {
      target[property] = value;
      onChange(target, property, { value });
      return true;
    },
    defineProperty(target, property, descriptor) {
      const define = Reflect.defineProperty(target, property, descriptor);
      onChange(target, property, descriptor);
      return define;
    },
    deleteProperty(target, property, descriptor) {
      const deleted = Reflect.deleteProperty(target, property);
      onChange(target, property, descriptor);
      return deleted;
    }
  };

  return new Proxy(object, handler);
};

export { templiteral, fragment, condition, Component, debounce, watch };
