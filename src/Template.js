import { ContentNode } from './ContentNode.js';
import { AttributeNode } from './AttributeNode.js';
import { valuePattern, propPattern } from './patterns.js';
import { deepEqual, protectProperty, valueToInt, removeSymbol, rendererSymbol, nullProps } from './utilities.js';
import { DirectiveNode } from './DirectiveNode.js';

export class Template {
  constructor(strings, values, location, context, group = null, index = null) {
    this.strings = strings;
    this.values = values;
    this.oldValues = values.map((value, index) => `---!{${index}}!---`);
    this.location = location;
    this.context = context;
    this.group = group;
    this.index = index;
    this.context.refs = this.context.refs || {};
    this.parts = [];
    this.partIndicies = new Map();
    this.context.$el = location;
    this.templateSymbol = Symbol('Template');
    this.nodes = [];
    this._init();
  }

  _append(node) {
    this.nodes = Array.from(node.children).map(child => {
      child[this.templateSymbol] = this;
      return child;
    });

    if (this.location instanceof Comment) {
      if (this.group) {
        this.location[this.group] = this.location[this.group] || new Map();
        let group = this.location[this.group];
        this.location[this.group].set(this.index, this);
        if (this.index === 0) {
          this.location.after(node);
        } else {
          let appendIndex = this.index - 1;
          while (!group.get(appendIndex)) {
            appendIndex -= 1;
          }
          group.get(appendIndex).nodes[group.get(this.index - 1).nodes.length - 1].after(node);
        }
      }
    } else {
      this.location.appendChild(node);
    }

    if (!this.context[rendererSymbol]) {
      protectProperty(this, rendererSymbol, this);
    }
  }

  _createBase() {
    return this.strings.map((string, index) => {
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
  }

  _createNode(baseText) {
    const fragment = document.createElement('template');
    fragment.innerHTML = baseText;
    return document.importNode(fragment.content, true);
  }

  _init() {
    const base = this._createBase();
    const baseNode = this._createNode(base);
    const walker = document.createTreeWalker(baseNode, 133, null, false);
    this._walk(walker, this.parts, true);
    this._append(baseNode);
  }

  _walk(walker, parts) {
    while (walker.nextNode()) {
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
            } else if (attribute.name.match('ref')) {
              this.context.refs[attribute.value] = currentNode;
            }
          }
          if (boundAttrs.size >= 1 || boundEvents.size >= 1) {
            const attrNode = new AttributeNode(currentNode, boundAttrs, boundEvents, this.context, this);
            parts.push(attrNode);
            attrNode.update(this.values, this.oldValues);
          }
        }
        break;
      }
      case 3: {
        if (currentNode.textContent && currentNode.textContent.match(valuePattern)) {
          const contentNode = new ContentNode(currentNode, this);
          parts.push(contentNode);
          contentNode.update(this.values, this.oldValues);
        }
        break;
      }
      case 8: {
        const valuesPart = valueToInt(currentNode.nodeValue);
        const initial = this.values[valuesPart];
        const value = this.values[valuesPart];
        const directiveNode = new DirectiveNode(currentNode, value, this.context, this, valuesPart, initial);
        parts.push(directiveNode);
        directiveNode.init(this.values[parts.length - 1]);
        break;
      }
      }
    }
  }

  update(values) {
    this.oldValues = this.values;
    this.values = values;
    
    for (let i = 0; i < values.length; i += 1 ) {
      const part = this.partIndicies.get(i);
      part && !deepEqual(values[i], this.oldValues[i]) && 
        part.update(values);
    }
  }

  [removeSymbol]() {
    this.nodes.forEach(templateChild => templateChild.parentNode.removeChild(templateChild));
    this.parts
      .filter(part => part instanceof AttributeNode)
      .forEach(part => part.disconnect());
    nullProps(this, ['nodes', 'parts', 'partIndicies', 'context', 'location', 'group']);
  }
}
