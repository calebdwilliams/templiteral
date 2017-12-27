import { ContentNode } from './ContentNode.js';
import { AttributeNode } from './AttributeNode.js';
import { valuePattern, eventPattern, propPattern } from './patterns.js';

export class Template {
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
      `${string ? string : ''}${this.values[index] ? '---!{' + index + '}!---' : ''}`
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
