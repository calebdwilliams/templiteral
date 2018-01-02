(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
	typeof define === 'function' && define.amd ? define(['exports'], factory) :
	(factory((global.templit = {})));
}(this, (function (exports) { 'use strict';

const valuePattern = /---!\{.*\}!---/gi;
const eventPattern = /^\(.*\)$/gi;
const propPattern = /^\[.*\]$/;
const sanitizePattern = /^this\./;
const startSeparator = /---!\{/gi;
const endSeparator = /\}!---/gi;

class ContentNode {
  constructor(node) {
    this.node = node;
    this.base = node.nodeValue || '';
    this.index = +this.base
      .match(valuePattern)[0]
      .replace(startSeparator, '')
      .replace(endSeparator, '');
  }

  set value(_value) {
    const newValue = this.base.replace(valuePattern, _value);
    this.value !== newValue ?
      this.node.nodeValue = newValue : null;
  }

  get value() {
    return this.node.nodeValue;
  }

  setValue(value = '') {
    this.node.nodeValue = this.base.replace(valuePattern, value);
  }

  update(values) {
    this.value = values[this.index];
  }
}

class AttributeNode {
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

  update(values) {
    this.boundAttrs.forEach(attribute => {
      const bases = attribute.base.match(/---!{*.}!---/g) || [];
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

class Template {
  constructor(strings, values, location, context) {
    this.strings = strings;
    this.values = values;
    this.oldValues = values.map((value, index) => `---!{${index}}!---`);
    this.location = location;
    this.context = context;
    this.parts = [];
    this.templiteralParts = new Set();
    this.eventHandlers = [];
    this._init();
  }

  _append(node) {
    this.parts.forEach((part, index) => {
      if (part instanceof ContentNode) {
        part.setValue(this.values[index], this.oldValues[index]);
      } else if (part instanceof AttributeNode) {
        part.update(this.values, this.oldValues);
      }
    });
    this.location.appendChild(node);
  }

  _init() {
    const base = this.strings.map((string, index) =>
      `${string ? string : ''}${this.values[index] !== undefined ? '---!{' + index + '}!---' : ''}`
    ).join('');
    const fragment = document.createElement('template');
    fragment.innerHTML = base;
    const baseNode = document.importNode(fragment.content, true);

    const walker = document.createTreeWalker(baseNode, 133, null, false);
    this._walk(walker, this.parts, true);
    this._append(baseNode);
  }

  _walk(walker, parts, setup) {
    let index = -1;
    while (walker.nextNode()) {
      const { currentNode } = walker;
      if (!currentNode.__templiteralCompiler) {
        switch (currentNode.nodeType) {
        case 1: {
          const { attributes } = currentNode;
          if (attributes.length) {
            const boundAttrs = new Map();
            const boundEvents = new Map();
            for (let i = 0; i < attributes.length; i += 1) {
              const attribute = attributes[i];
              if (attribute.value.match(valuePattern) || attribute.name.match(propPattern)) {
                boundAttrs.set(attribute.name, attribute);
              }
              if (setup && attribute.name.match(eventPattern)) {
                const eventName = attribute.name.substring(1, attribute.name.length - 1);
                boundEvents.set(eventName, attribute.value);
                this.eventHandlers.push({ eventName, currentNode });
              }
            }
            if (boundAttrs.size >= 1 || boundEvents.size >= 1) {
              index += 1;
              const attrNode = new AttributeNode(currentNode, boundAttrs, boundEvents, this.context, index);
              parts.push(attrNode);
            }
          }
          break;
        }
        case 3: {
          index += 1;
          if (currentNode.textContent && currentNode.textContent.match(valuePattern)) {
            index += 1;
            const contentNode = new ContentNode(currentNode, index);
            parts.push(contentNode);
          }
          break;
        }
        }
      } else {
        this.templiteralParts.add(currentNode);
      }
    }
    return parts;
  }

  update(values) {
    this.oldValues = this.values;
    this.values = values;

    this.parts.forEach((part) => {
      part.update(values, this.oldValues);
    });
  }
}

const templateCache = new Map();

function templiteral(location = this, context = this) {
  location.shadowRoot ? location = location.shadowRoot : null;

  return (strings, ...values) => {
    const templateKey = btoa(strings.join(''));
    let compiler = templateCache.get(templateKey);

    if (compiler) {
      compiler.update(values);
    } else {
      compiler = new Template(strings, values, location, context);
      templateCache.set(templateKey, compiler);
    }
  };
}

function registerElements(elements) {
  elements.forEach(elementClass =>
    customElements.define(elementClass.tagName, elementClass));
}

exports.templiteral = templiteral;
exports.registerElements = registerElements;

Object.defineProperty(exports, '__esModule', { value: true });

})));
