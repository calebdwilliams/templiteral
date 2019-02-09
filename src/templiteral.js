import { Template } from './Template.js';
import { protectProperty, protectGet, rendererSymbol, removeSymbol } from './utilities';
import '../node_modules/construct-style-sheets-polyfill/adoptedStyleSheets.js';

const templateCache = new WeakMap();

export function templiteral(location = this, context = this) {
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

export function fragment(key) {
  return (strings, ...values) => {
    protectProperty(values, '$$key', key);
    return [strings, values];
  };
}

export function condition(bool) {
  return (strings, ...values) => {
    protectProperty(values, '$$key', bool ? 'condition' : 'false');
    return bool ? [[strings, values]] : [[[], values]];
  };
}

export class Component extends HTMLElement {
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

export const watch = (object, onChange) => {
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
