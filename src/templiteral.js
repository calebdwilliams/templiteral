import { Template } from './Template.js';
import './TRepeat';
import './TIf';

const templateCache = new WeakMap();

export function templiteral(location = this, context = this) {
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

export class Component extends HTMLElement {
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
        return templiteral(location, self);
      },
      enumerable: false,
      configurable: false
    });
    
    Object.defineProperty(this, 'html', {
      enumerable: false,
      get() {
        return (...args) => {
          window.requestAnimationFrame(() => Reflect.apply(self.templiteral, self, args));
        };
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
