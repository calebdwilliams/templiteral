import { ContentNode } from './ContentNode.js';
import { AttributeNode } from './AttributeNode.js';
import { valuePattern, eventPattern, propPattern } from './patterns.js';

export class Fragment {
  constructor(strings, values, location, context) {
    this.strings = strings;
    this.values = values;
    this.oldValues = values.map((value, index) => `---!{${index}}!---`);
    this.context = context;
    this.location = location;
    this.parts = [];
    this.partIndicies = new Map();
    
    this.eventHandlers = [];
    this._init();
  }

  _setParts(node) {
    for (let i = 0; i < this.parts.length; i += 1) {
      const part = this.parts[i];
      if (part instanceof ContentNode) {
        part.setValue(this.values, this.oldValues[i]);
      } else if (part instanceof AttributeNode) {
        part.update(this.values, this.oldValues);
      }
    }
    this.node = node;
  }

  _init() {
    // const base = this.strings.map((string, index) =>
    //   `${string ? string : ''}${this.values[index] !== undefined ? '---!{' + index + '}!---' : ''}`
    // ).join('');
    const base = this.strings.map((string, index) => {
      let output = '';
      const value = this.values[index];
      string ? output += string : '';
      if (value !== undefined && value.symbol !== 'abc') {
        output += `---!{${index}}!---`;
      } else if (value && value.symbol === 'abc') {
        output += `---!{Directive${index}}!---`;
      }
      return output;
    }).join('');
    const fragment = document.createElement('template');
    fragment.innerHTML = base;
    const baseNode = document.importNode(fragment.content, true);

    const walker = document.createTreeWalker(baseNode, 133, null, false);
    this._walk(walker, this.parts, true);
    this._setParts(baseNode);
  }

  _walk(walker, parts, setup) {
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
              const attrNode = new AttributeNode(currentNode, boundAttrs, boundEvents, this.context, this);
              parts.push(attrNode);
            }
          }
          break;
        }
        case 3: {
          if (currentNode.textContent && currentNode.textContent.match(valuePattern)) {
            const contentNode = new ContentNode(currentNode, this);
            parts.push(contentNode);
            // if directive, replace the node
          }
          break;
        }
        }
      } else {
        this.templiteralParts.add(currentNode);
      }
    }
  }

  update(values) {
    this.oldValues = this.values;
    this.values = values;

    for (let i = 0; i < values.length; i += 1) {
      if (values[i] !== this.oldValues[i]) {
        this.partIndicies.get(i).update(values);
      }
    }
  }
}