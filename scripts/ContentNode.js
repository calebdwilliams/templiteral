export class ContentNode {
  constructor(node, index) {
    this.node = node;
    this.index = index;
  }

  cleanUp() {
    this.node.textContent = this.node.textContent.replace('---!{', '').replace('}!---', '');
  }

  update(newNode) {
    if (this.node.nodeValue !== newNode.node.nodeValue) {
      this.node.nodeValue = newNode.node.nodeValue;
    }
  }
}
