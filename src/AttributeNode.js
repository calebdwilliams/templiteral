import { propPattern, sanitizePattern, startSeparator, endSeparator, valuePattern } from './patterns.js';

export class AttributeNode {
  constructor(node, boundAttrs, boundEvents, context, compiler) {
    this.node = node;
    this.boundAttrs = boundAttrs;
    this.boundEvents = boundEvents;
    this.context = context;
    this.compiler = compiler;
    this.boundAttrs.forEach(attribute => {
      attribute.base = attribute.value;
      this.indicies = attribute.base.match(valuePattern).map(index => +index.replace(startSeparator, '').replace(endSeparator, ''));
      this.indicies.forEach(index => this.compiler.partIndicies.set(index, this));
    });
    
    this.addListeners();
  }

  addListeners() {
    this.boundEvents.forEach((eventHandler, eventName) => {
      const events = eventHandler.split(/;/);
      const eventsSafe = events.filter(event => event.match(sanitizePattern));
      const sanitizedEvents = eventsSafe.join('; ');
      if (eventHandler.match(sanitizePattern)) {
        const handler = new Function(sanitizedEvents).bind(this.context);
        this.node.addEventListener(eventName, handler);
        this.node._boundEvents = handler;
      }

      if (eventsSafe.length < events.length) {
        console.warn('Inline functions not allowed inside of event bindings. Unsafe functions have been removed from node', this.node);
      }
    });
  }

  updateProperty(attribute, attributeValue) {
    const attributeName = attribute.name.replace(/\[|\]/g, '');
    this.node[attributeName] = attributeValue;
    if (attributeValue && attributeValue !== 'false') {
      this.node.setAttribute(attributeName, attributeValue);        
    } else {
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
}
