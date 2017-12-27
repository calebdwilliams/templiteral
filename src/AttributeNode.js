import { propPattern, sanitizePattern, startSeparator, endSeparator } from './patterns.js';

export class AttributeNode {
  constructor(node, boundAttrs, boundEvents, context, index) {
    this.node = node;
    this.boundAttrs = boundAttrs;
    this.boundEvents = boundEvents;
    this.context = context;
    this.index = index;
    this.boundAttrs.forEach(attribute => attribute.base = attribute.value);

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

  cleanUp() {
    this.boundAttrs.forEach(attr =>
      attr.value = attr.value.replace(startSeparator, '').replace(endSeparator, ''));
  }

  updateAttributes(name, newAttr) {
    const attributeName = name.slice(1, -1);
    if (newAttr.value) {
      this.node[attributeName] = newAttr.value;
      this.node.setAttribute(attributeName, newAttr.value);
    } else {
      this.node.removeAttribute(attributeName);
    }
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

  update(values, oldValues) {
    this.boundAttrs.forEach(attribute => {
      const bases = attribute.base.match(/---\!{*.}\!---/g) || [];
      const baseIndicies = bases.map(base => +base.replace('---!{', '').replace('}!---', ''));
      let attributeValue = attribute.base;
      for (let i = 0; i < baseIndicies.length; i += 1) {
        const value = values[baseIndicies[i]];
        attributeValue = attributeValue.replace(`---!{${baseIndicies[i]}}!---`, value);
      }
      attribute.value = attributeValue;
      if (attribute.name.match(propPattern)) {
        this.updateProperty(attribute, attributeValue);
      }
    });
  }
}
