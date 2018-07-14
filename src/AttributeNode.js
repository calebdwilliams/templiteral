import { propPattern, sanitizePattern, startSeparator, endSeparator, valuePattern, modelSymbol } from './patterns.js';

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
      this.indicies = indicies.map(index => +index.replace(startSeparator, '').replace(endSeparator, ''));
      this.indicies.forEach(index => this.compiler.partIndicies.set(index, this));
    });
    
    this.addListeners();
  }

  addListeners() {
    this.boundEvents.forEach((eventHandler, eventName) => {
      if (eventName === modelSymbol) {
        this.context[eventHandler] = this.context[eventHandler] ? this.context[eventHandler] : undefined;
        this.node.value = this.context[eventHandler];
        this.node.addEventListener('input', this._modelFunction(eventHandler));
        this.node.addEventListener('change', this._modelFunction(eventHandler));        
      } else {
        const handlerName = eventHandler.replace(/(this\.)|(\(.*\))/gi, '');
        if (typeof this.context[handlerName] !== 'function') {
          console.error(`Method ${handlerName} is not a method of element ${this.context.tagName}`);
        } else {
          const handler = this.context[handlerName].bind(this.context);
          this.node.addEventListener(eventName, this.context[handlerName].bind(this.context));
          this.node._boundEvents = handler;
          
        }
      }
    });
  }

  updateProperty(attribute, attributeValue) {
    const attributeName = attribute.name.replace(/\[|\]/g, '');
    this.node[attributeName] = attributeValue;
    if (attributeValue && (attributeValue !== 'false' && attributeValue !== 'undefined')) {
      this.node.setAttribute(attributeName, attributeValue);
    } else {
      this.node[attributeName] = false;
      this.node.removeAttribute(attributeName);
    }
  }

  update(values) {
    this.boundAttrs.forEach(attribute => {
      const bases = attribute.base.match(/---!{*.}!---/g) || [];
      const baseIndicies = bases.map(base => +base.replace('---!{', '').replace('}!---', ''));
      let attributeValue = attribute.base;

      if (baseIndicies.length === 1) {
        attributeValue = attributeValue.replace(`---!{${baseIndicies[0]}}!---`, values[baseIndicies[0]]);
      } else if (baseIndicies.length > 1) {
        for (let i = 0; i < baseIndicies.length; i += 1) {
          const value = values[baseIndicies[i]] || '';
          attributeValue = attributeValue.replace(`---!{${baseIndicies[i]}}!---`, value);
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