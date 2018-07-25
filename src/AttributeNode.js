import { matchPattern, propPattern, valuePattern, modelSymbol, toEventName, valueToInt } from './patterns.js';

export class AttributeNode {
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
      const bases = attribute.base.match(matchPattern) || [];
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