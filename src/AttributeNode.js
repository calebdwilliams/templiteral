import { propPattern, sanitizePattern, startSeparator, endSeparator } from './patterns.js';

export class AttributeNode {
  constructor(node, boundAttrs, boundEvents, context, index) {
    this.node = node;
    this.boundAttrs = boundAttrs;
    this.boundEvents = boundEvents;
    this.context = context;
    this.index = index;
    this.boundAttrs.forEach(attribute => {
      attribute.base = attribute.value || `false`;
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
    //   attribute.value.split(' ')
    //     .forEach((oldValue, i) => {
    //       const index = oldValues.indexOf(oldValue);
    //       console.log(this.index, index, values, oldValues, values[index])
    //       // if (attribute.name === 'class' && index > -1) {
    //       //   try {
    //       //     this.node.classList.replace(oldValue, values[index]);
    //       //   } catch(error) {
    //       //     // this.node.classList.replace
    //       //   }
    //       // } else if (index > -1) {
    //       if (index > -1) {
    //         attribute.value = attribute.value.replace(oldValue, values[index]);
    //       }

    //       if (attribute.name.match(propPattern)) {
    //         const attributeName = attribute.name.replace(/\[|\]/g, '');
    //         this.node[attributeName] = values[index];
    //         console.log(attributeName, values[index], oldValue)
    //         console.log(attribute.base)
    //         values[index] ?
    //           this.node.setAttribute(attributeName, values[index]) :
    //           this.node.removeAttribute(attributeName);
    //       }
    //       // }
    //     });
    });
  }
}
