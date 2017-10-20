class ContentNode {
  constructor(node, index) {
    this.node = node;
    this.index = index;
  }

  cleanUp() {
    this.node.textContent = this.node.textContent
      .replace('---!{', '')
      .replace('}!---', '');
  }

  update(newNode) {
    if (this.node.nodeValue !== newNode.node.nodeValue) {
      this.node.nodeValue = newNode.node.nodeValue;
    }
    this.node = newNode;
  }
}

class AttributeNode {
  constructor(node, index, boundAttrs) {
    this.node = node;
    this.index = index;
    this.boundAttrs = boundAttrs;
  }

  cleanUp() {
    this.boundAttrs.forEach(attr => {
      attr.value = attr.value
        .replace('---!{', '')
        .replace('}!---', '');
    });
  }

  update(newNode) {
    this.boundAttrs.forEach(attr => {
      const { name } = attr;
      const newAttr = newNode.boundAttrs.get(name);
      attr.value = newAttr.value;
    });
    this.node = newNode;
    this.boundAttrs = newNode.boundAttrs;
  }
}

class Template {
  constructor(base, location, values) {
    const template = document.createElement('template');
    const content = base.replace(/\-\-\-\!\{/gi, '').replace(/\}\!\-\-\-/gi, '');
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
    while(walker.nextNode()) {
      index += 1;
      const { currentNode } = walker;
      const pattern = /\-\-\-\!\{.*\}\!\-\-\-/gi;
      switch (currentNode.nodeType) {
        case 1:
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
        case 3:
          if (currentNode.textContent && currentNode.textContent.match(pattern)) {
            const contentNode = new ContentNode(currentNode, index);
            updatedParts.push(contentNode);
            contentNode.cleanUp();
          }
          break;
      }
    }

    this.parts.forEach((part, index) => {
      if (part instanceof ContentNode) {
        part.update(updatedParts[index]);
      } else if (part instanceof AttributeNode) {
        part.update(updatedParts[index]);
      }
    });
  }

  _init(base) {
    const baseTemplate = document.createElement('template');
    baseTemplate.innerHTML = base;

    const baseNode = document.importNode(baseTemplate.content, true);
    const walker = document.createTreeWalker(baseNode, 133, null, false);
    let index = -1;
    while(walker.nextNode()) {
      index += 1;
      const { currentNode } = walker;
      const pattern = /\-\-\-\!\{.*\}\!\-\-\-/gi;
      switch (currentNode.nodeType) {
        case 1:
          const { attributes } = currentNode;

          if (attributes.length) {
            const boundAttrs = new Map();
            for (let i = 0; i < attributes.length; i += 1) {
              if (attributes[i].value.match(pattern)) {
                boundAttrs.set(attributes[i].name, attributes[i]);
              }
            }
            console.log(boundAttrs)

            if (boundAttrs.size >= 1) {
              const attrNode = new AttributeNode(currentNode, index, boundAttrs);
              this.parts.push(attrNode);
              attrNode.cleanUp();
            }
          }
          break;
        case 3:
          if (currentNode.textContent && currentNode.textContent.match(pattern)) {
            const contentNode = new ContentNode(currentNode, index);
            this.parts.push(contentNode);
            contentNode.cleanUp();
          }
          break;
      }
    }
    this.node = baseNode;
    this.paint();
  }
}

function html(location) {
  return function(strings, ...values) {
    const output = strings.map((string, index) =>
      `${string ? string : ''}${values[index] ? '---!{' + values[index] + '}!---' : ''}`).join('');
    if (!location.__renderer) {
      const renderer = new Template(output, location, values);
      // renderer.paint();
      location.__renderer = renderer;
      return output;
    } else {
      location.__renderer.update(output, values);
    }
  }
}

export function compile(context, location) {
  function render(...args) {
    const renderer = Reflect.apply(html, context, [location]);
    return Reflect.apply(renderer, context, args);
  }

  return render.bind(context);
}
