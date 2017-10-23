import { ContentNode } from './ContentNode.js';
import { AttributeNode } from './AttributeNode.js';

export class Template {
  constructor(base, location, values) {
    const template = document.createElement('template');
    const content = base.replace(/---!\{/gi, '').replace(/\}!---/gi, '');
    this.templateBase = base;
    template.innerHTML = content;
    this.node = document.importNode(template.content, true);
    this.parts = [];
    this.identifier = Math.random();
    this.location = location;
    this.values = values;
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

  _parseUpdates(walker) {
    let index = -1;
    const updatedParts = [];
    const pattern = /---!\{.*\}!---/gi;
    while (walker.nextNode()) {
      index += 1;
      const { currentNode } = walker;
      switch (currentNode.nodeType) {
      case 1: {
        const { attributes } = currentNode;
        if (attributes.length) {
          const boundAttrs = new Map();
          for (let i = 0; i < attributes.length; i += 1) {
            if (attributes[i].value.match(pattern)) {
              boundAttrs.set(attributes[i].name, attributes[i]);
            }
          }
          if (boundAttrs.size >= 1) {
            const attrNode = new AttributeNode(currentNode, index, boundAttrs);
            updatedParts.push(attrNode);
            attrNode.cleanUp();
          }
        }
        break;
      }
      case 3: {
        if (currentNode.textContent && currentNode.textContent.match(pattern)) {
          const contentNode = new ContentNode(currentNode, index);
          updatedParts.push(contentNode);
          contentNode.cleanUp();
        }
        break;
      }
      }
    }

    this.parts.forEach((part, index) => part.update(updatedParts[index]));
  }

  _init(base) {
    const baseTemplate = document.createElement('template');
    baseTemplate.innerHTML = base;
    const pattern = /---!\{.*\}!---/gi;
    const baseNode = document.importNode(baseTemplate.content, true);
    const walker = document.createTreeWalker(baseNode, 133, null, false);
    let index = -1;
    while (walker.nextNode()) {
      index += 1;
      const { currentNode } = walker;
      switch (currentNode.nodeType) {
      case 1: {
        const { attributes } = currentNode;
        if (attributes.length) {
          const boundAttrs = new Map();
          for (let i = 0; i < attributes.length; i += 1) {
            if (attributes[i].value.match(pattern)) {
              boundAttrs.set(attributes[i].name, attributes[i]);
            }
          }
          if (boundAttrs.size >= 1) {
            const attrNode = new AttributeNode(currentNode, index, boundAttrs);
            this.parts.push(attrNode);
            attrNode.cleanUp();
          }
        }
        break;
      }
      case 3: {
        if (currentNode.textContent && currentNode.textContent.match(pattern)) {
          const contentNode = new ContentNode(currentNode, index);
          this.parts.push(contentNode);
          contentNode.cleanUp();
        }
        break;
      }
      }
    }
    this.node = baseNode;
    this.paint();
  }
}
