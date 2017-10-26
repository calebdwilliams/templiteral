var templit = (function (exports) {
'use strict';

const valuePattern = /---!\{.*\}!---/gi;
const eventPattern = /^\(.*\)$/gi;
const propPattern = /^\[.*\]$/;
const sanitizePattern = /^this\./;
const startSeparator = /---!\{/gi;
const endSeparator = /\}!---/gi;

class ContentNode {
  constructor(node, index) {
    this.node = node;
    this.index = index;
  }

  cleanUp() {
    this.node.textContent = this.node.textContent.replace(startSeparator, '').replace(endSeparator, '');
  }

  update(newNode) {
    if (this.node.nodeValue !== newNode.node.nodeValue) {
      this.node.nodeValue = newNode.node.nodeValue;
    }
  }
}

class AttributeNode {
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
      const sanitizedEvents = eventsSafe.join('; ');
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
      attr.value = attr.value.replace(startSeparator, '').replace(endSeparator, ''));
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
      this.node;
      this.node.removeAttribute(attributeName);
    }
  }
}

class Template {
  constructor(base, location, context) {
    const template = document.createElement('template');
    const content = base.replace(startSeparator, '').replace(endSeparator, '');
    template.innerHTML = content;
    this.node = document.importNode(template.content, true);
    this.parts = new Map();
    this.eventHandlers = [];
    this.location = location;
    this.context = context;
    this._init(base);
  }

  paint() {
    this.location.appendChild(this.node);
  }

  update(content) {
    const template = document.createElement('template');
    template.innerHTML = content;
    const newNode = document.importNode(template.content, true);
    const newNodeWalker = document.createTreeWalker(newNode, 133, null, false);
    this._parseUpdates(newNodeWalker);
  }

  _parseUpdates(walker) {
    const updatedParts = this._walk(walker, new Map());
    this.parts.forEach((part, index) => part.update(updatedParts.get(index)));
  }

  _init(base) {
    const baseTemplate = document.createElement('template');
    baseTemplate.innerHTML = base;
    const baseNode = document.importNode(baseTemplate.content, true);
    const walker = document.createTreeWalker(baseNode, 133, null, false);
    this._walk(walker, this.parts);
    this.node = baseNode;
    this.paint();
  }

  _walk(walker, parts) {
    let index = -1;

    while (walker.nextNode()) {
      index += 1;
      const { currentNode } = walker;
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
            if (attribute.name.match(eventPattern)) {
              const eventName = attribute.name.substring(1, attribute.name.length - 1);
              boundEvents.set(eventName, attribute.value);
              this.eventHandlers.push({ eventName, currentNode });
            }
          }
          if (boundAttrs.size >= 1 || boundEvents.size >= 1 || this.parts.has(index)) {
            const attrNode = new AttributeNode(currentNode, index, boundAttrs, boundEvents, this.context);
            parts.set(index, attrNode);
            attrNode.cleanUp();
          }
        }
        break;
      }
      case 3: {
        if (currentNode.textContent && currentNode.textContent.match(valuePattern) || this.parts.has(index)) {
          const contentNode = new ContentNode(currentNode, index);
          parts.set(index, contentNode);
          contentNode.cleanUp();
        }
        break;
      }
      }
    }

    return parts;
  }
}

const templateCache = new Map();

function html(location) {
  return function(strings, ...values) {
    const output = strings.map((string, index) =>
      `${string ? string : ''}${values[index] ? '---!{' + values[index] + '}!---' : ''}`).join('');
    const templateKey = btoa(strings.join(''));

    let compiler = templateCache.get(templateKey);

    if (compiler) {
      compiler.update(output);
    } else {
      compiler = new Template(output, location, this);
      templateCache.set(templateKey, compiler);
    }
  }
}

function templit(location, context) {
  function render(...args) {
    const renderer = Reflect.apply(html, context, [location]);
    return Reflect.apply(renderer, context, args);
  }
  return render.bind(context);
}

exports.templit = templit;

return exports;

}({}));
