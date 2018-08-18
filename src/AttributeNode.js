import { matchPattern, propPattern, valuePattern, toEventName, valueToInt } from './patterns.js';

export class AttributeNode {
  constructor(node, boundAttrs, boundEvents, context, compiler) {
    this.node = node;
    this.boundAttrs = boundAttrs;
    this.boundEvents = boundEvents;
    this.context = context;
    this.compiler = compiler;
    this.boundAttrs.forEach(attribute => {
      attribute.base = attribute.value;
      attribute.bases = attribute.base.match(matchPattern) || [];
      attribute.baseIndicies = attribute.bases.map(valueToInt);
      attribute.cleanName  = attribute.name.replace(/\[|\]/g, '');
      const indicies = attribute.base.match(valuePattern) || [];
      this.indicies = indicies.map(valueToInt);
      this.indicies.forEach(index => this.compiler.partIndicies.set(index, this));
    });
    this.eventMap = new Map();
  }

  addListener(eventName, method) {
    if (!this.eventMap.get(eventName)) {
      this.node.addEventListener(eventName, method.bind(this.context));
      this.eventMap.set(eventName, method);
      !this.context.DEBUG ? this.node.removeAttribute(`(${eventName})`) : null;
    }
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
    const attributeName = attribute.cleanName;
    !this.context.DEBUG ? this.node.removeAttribute(attribute.name) : null;
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
      let attributeValue = attribute.base;
      
      for (let i = 0; i < attribute.baseIndicies.length; i += 1) {
        const index = attribute.baseIndicies[i];
        const value = values[index] || '';
        if (typeof value !== 'function') {
          attributeValue = attributeValue.replace(`---!{${index}}!---`, value);
        } else {
          this.addListener(toEventName(attribute.name), value);
          this.boundAttrs.delete(attribute.name);
        }
      }
      
      attribute.value = attributeValue;
      if (attribute.name.match(propPattern)) {
        if (attribute.baseIndicies.length === 1) {
          attributeValue = values[attribute.baseIndicies[0]];
        }
        this.updateProperty(attribute, attributeValue);
      }
    });
  }
}