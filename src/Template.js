import { ContentNode } from './ContentNode';
import { AttributeNode } from './AttributeNode';
import { valuePattern, eventPattern, propPattern, modelPattern, modelSymbol, valueToInt, removeSymbol, rendererSymbol } from './patterns';
import { DirectiveNode } from './DirectiveNode';

export class Template {
  constructor(strings, values, location, context) {
    this.strings = strings;
    this.values = values;
    this.oldValues = values.map((value, index) => `---!{${index}}!---`);
    this.location = location;
    this.context = context;
    this.context.refs = this.context.refs || {};
    this.parts = [];
    this.partIndicies = new Map();
    this.context.$el = location;
    this.templateSymbol = Symbol('Template');
    this.eventHandlers = [];
    this.nodes = [];
    this._init();
  }

  _append(node) {
    for (let i = 0; i < this.parts.length; i += 1) {
      const part = this.parts[i];
      if (part instanceof ContentNode) {
        part.setValue(this.values, this.oldValues[i]);
      } else if (part instanceof AttributeNode) {
        part.update(this.values, this.oldValues);
      } else if (part instanceof DirectiveNode) {
        part.init();
      }
    }
    const symbol = this.templateSymbol;
    this.nodes = Array.from(node.children).map(child => {
      child[symbol] = true;
      return child;
    });
    this.location.appendChild(node);

    if (!this.context[rendererSymbol]) {
      Object.defineProperty(this, rendererSymbol, {
        value: this,
        enumerable: false,
        configurable: false,
        writable: false
      });

      this.context.onInit && typeof this.context.onInit === 'function' && this.context.onInit();
    }
  }

  _init() {
    const _base = this.strings.map((string, index) => {
      const value = this.values[index];
      const interpolationValue = `---!{${index}}!---`;
      let output = '';
      output += string ? string : '';
      if (value !== undefined && !Array.isArray(value)) {
        output += interpolationValue;
      } else if (value !== undefined && Array.isArray(value)) {
        output += `<!-- ${interpolationValue} -->`;
      }
      return output;
    }).join('');
    const fragment = document.createElement('template');
    fragment.innerHTML = _base;
    const baseNode = document.importNode(fragment.content, true);

    const walker = document.createTreeWalker(baseNode, 133, null, false);
    this._walk(walker, this.parts, true);
    this._append(baseNode);
  }

  _walk(walker, parts) {
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
              } else if (attribute.name.match(eventPattern)) {
                if (!attribute.value.match(valuePattern)) {
                  const eventName = attribute.name.substring(1, attribute.name.length - 1);
                  boundEvents.set(eventName, attribute.value);
                  this.eventHandlers.push({ eventName, currentNode });
                } else if (attribute.value.match(valuePattern)) {
                  const eventName = attribute.name.substring(1, attribute.name.length - 1);
                  const handler = this.values[valueToInt(attribute.value)];
                  boundEvents.set(eventName, handler);
                  this.eventHandlers.push({ eventName, currentNode });
                }
              } else if (attribute.name.match(modelPattern)) {
                boundEvents.set(modelSymbol, attribute.value);
              } else if (attribute.name.match('ref')) {
                this.context.refs[attribute.value] = currentNode;
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
          }
          break;
        }
        case 8: {
          const valuesPart = valueToInt(currentNode.nodeValue);
          const initial = this.values[valuesPart];
          const value = this.values[valuesPart];
          const directiveNode = new DirectiveNode(currentNode, value, this.context, this, valuesPart, initial);
          parts.push(directiveNode);
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
        window.requestAnimationFrame(() => 
          this.partIndicies.get(i).update(values)
        );
      }
    }
  }

  [removeSymbol]() {
    this.nodes.forEach(templateChild => this.location.removeChild(templateChild));
    this.parts
      .filter(part => part instanceof AttributeNode)
      .forEach(part => part.disconnect());
  }
}
