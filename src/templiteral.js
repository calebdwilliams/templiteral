import { Template } from './Template.js';
import { protectProperty, protectGet, rendererSymbol, removeSymbol } from './utilities';
import { StyleSheetRegistry } from '../node_modules/stylit/lib/stylit.js';

const templateCache = new WeakMap();
const styleRegistry = new StyleSheetRegistry();

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
  static get styles() { return styleRegistry; }
  static get defineStyles() { return this.styles.define.bind(styleRegistry); }
  static get hasStyles() { return this.styles.registry.has.bind(styleRegistry.registry); }
  static get loadStyles() { return this.styles.load.bind(styleRegistry); }
  static get adoptStyles() { return this.styles.adopt.bind(styleRegistry); }
  static get boundAttributes() { return []; }
  static get boundProps() { return []; }
  static get observedAttributes() { return [...this.boundAttributes]; }
  static get booleanAttributes() { return []; }
  
  constructor(init) {
    super();
    if (init) {
      this.attachShadow(init);
    }
    const state = {};
    const attrs = new Set();
    const stateProxy = watch(state, (target, property, descriptor) => {
      try {
        if (this.constructor.boundAttributes.includes(property)) {
          if (descriptor.value === false || descriptor.value === null) {
            this.removeAttribute(property);
          } else {
            this.setAttribute(property, descriptor.value);
          }
        }
        this.render.bind(this)();
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
          attrs.add(attr);
        }
      });
    });
    
    protectGet(this, 'templiteral', () => templiteral(this.shadowRoot ? this.shadowRoot : this, this));
    protectGet(this, 'html', () => (...args) => Reflect.apply(this.templiteral, this, args));
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

  get $$renderListener() {
    return this.render;
  }
  
  connectedCallback() {
    this.render();

    if (!this.$$listening) {
      this.addEventListener('ComponentRender', this.$$renderListener);
    }

    if (this.constructor.hasStyles(this.tagName.toLowerCase())) {
      this.constructor.adoptStyles(this.shadowRoot ? this.shadowRoot : this, this.tagName.toLowerCase());
    }
    
    this.$$listening = true;
    this.onInit();
  }
  
  disconnectedCallback() {
    templateCache.delete(this);
    this.removeEventListener('ComponentRender', this.$$renderListener);
    this.$$listening = false;
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

export const debounce = (fn, wait, immediate) => {
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
