import { Template } from './Template.js';
import { rendererSymbol, removeSymbol } from './patterns.js';

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
    Object.defineProperty(values, '$$key', {
      value: key,
      enumerable: false,
      configurable: false,
      writable: false
    });
    return [strings, values];
  };
}

export function condition(bool) {
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

export class Component extends HTMLElement {
  static get boundAttributes() { return []; }
  static get observedAttributes() { return [...this.boundAttributes]; }
  static get renderer() { return 'render'; }
  
  constructor(init) {
    super();
    if (init) {
      this.attachShadow(init);
    }
    const state = {};
    const self = this;
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
        this[this.constructor.renderer].bind(this)();
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
            state[key] = watch(_state[key], () => this[this.constructor.renderer]());
          }
        });
        return true;
      }
    });

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
    if (oldValue !== newValue) {
      this.state[name] = newValue;
    } else if (newValue === '' && this.hasAttribute(name)) {
      this.state[name] = true;
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
    
    this.$$listening = true;
  }
  
  disconnectedCallback() {
    templateCache.delete(this);
    if (this.constructor.renderer && typeof this[this.constructor.renderer] === 'function') {
      this.removeEventListener('ComponentRender', this.$$renderListener);
      this.$$listening = false;
    }
    this[rendererSymbol] && this[rendererSymbol][removeSymbol]();
    if (this.onDestroy && typeof this.onDestroy === 'function') {
      this.onDestroy();
    }
  }

  emit(eventName, detail) {
    this.dispatchEvent(new CustomEvent(eventName, { 
      bubbles: true,
      composed: true,
      detail 
    }));
  }
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
