import { propPattern, sanitizePattern } from './patterns.js';

export class AttributeNode {
  constructor(node, index, boundAttrs, boundEvents, context) {
    this.node = node;
    this.index = index;
    this.boundAttrs = boundAttrs;
    this.boundEvents = boundEvents;
    this.context = context;

    this.addListeners();
  }

  addListeners() {
    this.boundEvents.forEach((eventHandler, eventName) => {
      const events = eventHandler.split(/\;/);
      const eventsSafe = events.filter(event => event.match(sanitizePattern));
      const sanitizedEvents = eventsSafe.join('; ')
      if (eventHandler.match(sanitizePattern)) {
        const handler = new Function(sanitizedEvents);
        this.node.addEventListener(eventName, handler.bind(this.context));
      }

      if (eventsSafe.length < events.length) {
        console.warn('Inline functions not allowed inside of event bindings. Unsafe functions have been removed from node', this.node);
      }
    });
  }

  cleanUp() {
    this.boundAttrs.forEach(attr =>
      attr.value = attr.value.replace('---!{', '').replace('}!---', ''));
  }

  update(newNode) {
    this.boundAttrs.forEach(attr => {
      const newAttr = newNode.boundAttrs.get(attr.name);
      newAttr && attr.value !== newAttr.value ? attr.value = newAttr.value : null;

      /* TODO */
      if (attr.name.match(propPattern)) {
        this.updateAttributes(attr.name, newAttr);
      }
    });
  }

  updateAttributes(name, newAttr) {
    const attributeName = name.slice(1, -1);
    if (newAttr.value) {
      this.node[attributeName] = newAttr.value;
      this.node.setAttribute(attributeName, newAttr.value);
    } else {
      this.node
      this.node.removeAttribute(attributeName);
    }
  }
}
