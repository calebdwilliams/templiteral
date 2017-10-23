export class AttributeNode {
  constructor(node, index, boundAttrs) {
    this.node = node;
    this.index = index;
    this.boundAttrs = boundAttrs;
  }

  cleanUp() {
    this.boundAttrs.forEach(attr =>
      attr.value = attr.value.replace('---!{', '').replace('}!---', ''));
  }

  update(newNode) {
    this.boundAttrs.forEach(attr => {
      const newAttr = newNode.boundAttrs.get(attr.name);
      attr.value !== newAttr.value ? attr.value = newAttr.value : null;
    });
  }
}
