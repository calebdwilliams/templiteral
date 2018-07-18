import { Template } from './Template.js';
import './TRepeat';
import './TIf';

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

export class Component extends HTMLElement {
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
          return this.getAttribute(attr);
        },
        set(_attr) {
          if (_attr) {
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
      enumerable: false,
      configurable: false
    });
    
    Object.defineProperty(this, 'html', {
      enumerable: false,
      get() {
        return (...args) => {
          return new Promise(resolve => {
            window.requestAnimationFrame(() => resolve(Reflect.apply(self.templiteral, self, args)));
          });
        };
      }
    });

    Object.defineProperty(this, 'fragment', {
      enumerable: false,
      get() {
        return fragment;
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
  }
}

export const watch = (object, onChange) => {
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
