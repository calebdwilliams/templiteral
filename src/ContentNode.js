import { startSeparator, endSeparator } from './patterns.js';

export class ContentNode {
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
