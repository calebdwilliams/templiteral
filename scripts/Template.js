import { ContentNode } from './ContentNode.js';
import { AttributeNode } from './AttributeNode.js';
import { valuePattern, eventPattern, propPattern } from './patterns.js';

export class Template {
  constructor(base, location, context) {
    const template = document.createElement('template');
    const content = base.replace(/---!\{/gi, '').replace(/\}!---/gi, '');
    this.templateBase = base;
    template.innerHTML = content;
    this.node = document.importNode(template.content, true);
    this.parts = new Map();
    this.eventHandlers = [];
    this.identifier = Math.random();
    this.location = location;
    this.context = context;
    this._init(base);
  }

  paint() {
    this.location.appendChild(this.node);
  }

  update(content, values) {
    const template = document.createElement('template');
    template.innerHTML = content;
    const newNode = document.importNode(template.content, true);
    const newNodeWalker = document.createTreeWalker(newNode, 133, null, false);
    this._parseUpdates(newNodeWalker);
  }

  _parseUpdates(walker, parts) {
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
            if (attributes[i].value.match(valuePattern) || attributes[i].name.match(propPattern)) {
              boundAttrs.set(attributes[i].name, attributes[i]);
            }
            if (attributes[i].name.match(eventPattern)) {
              const eventName = attributes[i].name.substring(1, attributes[i].name.length - 1);
              boundEvents.set(eventName, attributes[i].value);
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
