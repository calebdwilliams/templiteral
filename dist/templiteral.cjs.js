'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

const valuePattern = /---!{.*?(}!---)/gi;
const propPattern = /^\[.*\]$/;
const matchPattern = /---!{\d+}!---/gi;

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

const protectProperty = (target, prop, value) => Object.defineProperty(target, prop, {
  value,
  enumerable: false,
  configurable: false,
  writable: false
});

const protectGet = (target, prop, get) => Object.defineProperty(target, prop, {
  get,
  configurable: false,
  enumerable: false
});

const rendererSymbol = Symbol('Renderer');
const repeaterSymbol = Symbol('Repeater');
const removeSymbol = Symbol('RemoveTemplate');
const templateSymbol = Symbol();
const valueToInt = match => +match.replace(/(---!{)|(}!---)/gi, '');
const toEventName = match => match.replace(/(\()|(\))/gi, '');
const nullProps = (context, props) => props.forEach(prop => context[prop] = null);

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

  _updateAttribute(attribute, attributeValue) {
    if (attributeValue && (attributeValue !== 'false' && attributeValue !== 'undefined')) {
      this.node.setAttribute(attribute.name, attributeValue);
    } else {
      this.node.removeAttribute(attribute.name);
    }
  }

  _updateProp(attribute, attributeValue) {
    const attributeName = attribute.cleanName;
    this.node[attributeName] = attributeValue;
    this.context.DEBUG ? null : this.node.removeAttribute(attribute.name);
  }
}

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
      Promise.resolve()
        .then(() => {
          this.location.adoptedStyleSheets = this.location.adoptedStyleSheets;
        });
    }

    if (!this.context[rendererSymbol]) {
      protectProperty(this, rendererSymbol, this);
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
    let fragment = this[templateSymbol];
    if (!fragment) {
      fragment = document.createElement('template');
      fragment.innerHTML = baseText;
    }
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
    this.parts
      .filter(part => part instanceof AttributeNode)
      .forEach(part => part.disconnect());
    nullProps(this, ['nodes', 'parts', 'partIndicies', 'context', 'location', 'group']);
  }
}

(function() {
  'use strict';

  const supportsAdoptedStyleSheets = 'adoptedStyleSheets' in document;  
  
  if (!supportsAdoptedStyleSheets) {
    function replaceSync(contents) {
      if (this[node]) {
        this[node]._sheet.innerHTML = contents;
        updateAdopters(this);
        return this[node]._sheet.sheet;
      } else {
        throw new TypeError('replaceSync can only be called on a constructed style sheet');
      }
    }

    function replace(contents) {
      return new Promise((resolve, reject) => {
        if (this[node]) {
          this[node]._sheet.innerHTML = contents;
          resolve(this[node]._sheet.sheet);
          updateAdopters(this);
        } else {
          reject('replace can only be called on a constructed style sheet');
        }
      });
    }

    const node = Symbol('constructible style sheets');
    const constructed = Symbol('constructed');
    const obsolete = Symbol('obsolete');
    const iframe = document.createElement('iframe');
    const mutationCallback = mutations => {
      mutations.forEach(mutation => {
        const { addedNodes, removedNodes } = mutation;
        removedNodes.forEach(removed => {
          if (removed[constructed] && !removed[obsolete]) {
            setTimeout(() => {
              removed[constructed].appendChild(removed);
            });
          }
        });
        
        addedNodes.forEach(added => {
          const { shadowRoot } = added;
          if (shadowRoot && shadowRoot.adoptedStyleSheets) {
            shadowRoot.adoptedStyleSheets.forEach(adopted => {
              shadowRoot.appendChild(adopted[node]._sheet);
            });
          }
        });
      });
    };
    const observer = new MutationObserver(mutationCallback);
    observer.observe(document.body, { childList: true });
    iframe.hidden = true;
    document.body.appendChild(iframe);
    
    const appendContent = (location, sheet) => {
      const clone = sheet[node]._sheet.cloneNode(true);
      location.body ? location = location.body : null;
      clone[constructed] = location;  
      sheet[node]._adopters.push({ location, clone });
      location.appendChild(clone);
      return clone;
    };

    const updateAdopters = sheet => {
      sheet[node]._adopters.forEach(adopter => {
        adopter.clone.innerHTML = sheet[node]._sheet.innerHTML;
      });
    };
    
    const onShadowRemoval = (root, observer) => event => {
      const shadowRoot = event.target.shadowRoot;
      if (shadowRoot && shadowRoot.adoptedStyleSheets.length) {
        const adoptedStyleSheets = shadowRoot.adoptedStyleSheets;
        adoptedStyleSheets
          .map(sheet => sheet[node])
          .map(sheet => {
          sheet._adopters = sheet._adopters.filter(adopter => adopter.location !== shadowRoot);
        });
      }
      observer.disconnect();
    };

    class _StyleSheet {
      constructor() {
        this._adopters = [];
        const style = document.createElement('style');
        iframe.contentWindow.document.body.appendChild(style);
        this._sheet = style;
        style.sheet[node] = this;
        if (!style.sheet.constructor.prototype.replace) {
          style.sheet.constructor.prototype.replace = replace;
          style.sheet.constructor.prototype.replaceSync = replaceSync;
        }
        return style.sheet;
      }
    }

    StyleSheet.prototype.replace = replace;
    CSSStyleSheet.prototype.replace = replace;

    CSSStyleSheet.prototype.replaceSync = replaceSync;
    StyleSheet.prototype.replaceSync = replaceSync;

    window.CSSStyleSheet = _StyleSheet;
    const adoptedStyleSheetsConfig = {
      get() {
          return this._adopted || [];
      },
      set(sheets) {
        const location = this.body ? this.body : this;
        this._adopted = this._adopted || [];
        const observer = new MutationObserver(mutationCallback);
        observer.observe(this, { childList: true });
        if (!Array.isArray(sheets)) {
          throw new TypeError('Adopted style sheets must be an Array');
        }
        sheets.forEach(sheet => {
          if (!sheet instanceof CSSStyleSheet) {
            throw new TypeError('Adopted style sheets must be of type CSSStyleSheet');
          }
        });
        const uniqueSheets = [...new Set(sheets)];
        const removedSheets = this._adopted.filter(sheet => !uniqueSheets.includes(sheet));
        removedSheets.forEach(sheet => {
          const styleElement = sheet[node]._adopters.filter(adopter => adopter.location === location)[0].clone;
          styleElement[obsolete] = true;
          styleElement.parentNode.removeChild(styleElement);
        });
        this._adopted = uniqueSheets;
        
        if (this.isConnected) {
          sheets.forEach(sheet => {
            appendContent(this, sheet);
          });
        }
        
        const removalListener = onShadowRemoval(this, observer);
        this[removalListener] = removalListener;
        this.addEventListener('DOMNodeRemoved', removalListener, true);
      }
    };

    Object.defineProperty(ShadowRoot.prototype, 'adoptedStyleSheets', adoptedStyleSheetsConfig);
    Object.defineProperty(document, 'adoptedStyleSheets', adoptedStyleSheetsConfig);
  }
}(undefined));

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
    protectProperty(values, '$$key', key);
    return [strings, values];
  };
}

function condition(bool) {
  return (strings, ...values) => {
    protectProperty(values, '$$key', bool ? 'condition' : 'false');
    return bool ? [[strings, values]] : [[[], values]];
  };
}

class Component extends HTMLElement {
  static get boundAttributes() { return []; }
  static get boundProps() { return []; }
  static get observedAttributes() { return [...this.boundAttributes]; }
  static get booleanAttributes() { return []; }
  
  constructor() {
    super();
    const state = {};
    const attrs = new Set();
    const updatedHooks = new Map();
    const stateProxy = watch(state, (target, property, descriptor) => {
      try {
        if (this.constructor.boundAttributes.includes(property)) {
          if (descriptor.value === false || descriptor.value === null) {
            this.removeAttribute(property);
          } else {
            this.setAttribute(property, descriptor.value);
          }
        }
        this.render();
      } catch (err) {
        console.log(err);
      }
    });

    Object.defineProperty(this, 'state', {
      get() {
        return stateProxy;
      },
      set(_state) {
        Object.keys(_state).forEach(key => {
          if (typeof _state[key] !== 'string' || typeof _state[key] !== 'number') {
            state[key] = _state[key];
          } else {
            state[key] = watch(_state[key], () => this.render());
          }
        });
        return true;
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
          if (this.isConnected && attrs.size === currentArray.length) {
            this.render();
          }
          if (this.updatedHooks.has(attr) && this.$$listening) {
            this.updatedHooks.get(attr).apply(this, [value, attr]);
          }
          attrs.add(attr);
        }
      });
    });

    protectGet(this, 'templiteral', () => templiteral(this.shadowRoot ? this.shadowRoot : this, this));
    protectGet(this, 'html', () => (...args) => Reflect.apply(this.templiteral, this, args));
    protectProperty(this, 'updatedHooks', updatedHooks);
    protectProperty(this, 'fragment', fragment);
    protectProperty(this, 'if', condition);
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (this.constructor.booleanAttributes.includes(name) && oldValue !== newValue) {
      newValue = newValue === '' ? true : newValue;
      this.state[name] = !!newValue;
      if (this.constructor.boundProps.includes(name)) {
        this[name] = !!newValue;
      }
    } else if (oldValue !== newValue) {
      this.state[name] = newValue;
      if (this.constructor.boundProps.includes(name)) {
        this[name] = newValue;
      }
    }
    this.emit('ComponentRender', {
      component: this,
      time: Date.now(),
    });
  }

  connectedCallback() {
    this.render();

    if (!this.$$listening) {
      this.addEventListener('ComponentRender', this.render);
    }
    
    this.$$listening = true;
    this.onInit();
  }
  
  disconnectedCallback() {
    templateCache.delete(this);
    this.removeEventListener('ComponentRender', this.render);
    this.$$listening = false;
    this[rendererSymbol] && this[rendererSymbol][removeSymbol]();
    this.onDestroy();
  }

  
  emit(eventName, detail) {
    this.dispatchEvent(new CustomEvent(eventName, { 
      bubbles: true,
      composed: true,
      detail 
    }));
  }
  
  onInit() {}
  onDestroy() {}
  render() {}
}

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

exports.templiteral = templiteral;
exports.fragment = fragment;
exports.condition = condition;
exports.Component = Component;
exports.watch = watch;
