import { Template } from './Template.js';
import { rendererSymbol, removeSymbol } from './patterns.js';
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
          state[key] = value;
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

// export const watch = (object, onChange) => {
//   const handler = {
//     get(target, property, receiver) {
//       try {
//         const desc = Object.getOwnPropertyDescriptor(target, property);
//         const value = Reflect.get(target, property, receiver);
  
//         if (desc && !desc.writable && !desc.configurable) {
//           return value;
//         }
//         if (typeof target[property] === 'function' && (target instanceof Date || target instanceof Map ||target instanceof WeakMap)) {
//           return new Proxy(target[property].bind(target), handler);
//         }
//         return new Proxy(target[property], handler);
//       } catch (err) {
//         if (target instanceof HTMLElement) {
//           return target[property];
//         }
//         return Reflect.get(target, property, receiver);
//       }
//     },
//     set(target, property, value) {
//       target[property] = value;
//       onChange(target, property, { value });
//       return true;
//     },
//     defineProperty(target, property, descriptor) {
//       const define = Reflect.defineProperty(target, property, descriptor);
//       onChange(target, property, descriptor);
//       return define;
//     },
//     deleteProperty(target, property, descriptor) {
//       const deleted = Reflect.deleteProperty(target, property);
//       onChange(target, property, descriptor);
//       return deleted;
//     }
//   };

//   return new Proxy(object, handler);
// };