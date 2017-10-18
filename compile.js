class Template {
  constructor(content) {
    // this.element = element;
    const template = document.createElement('template');
    template.innerHTML = content;
    this.node = document.importNode(template.content, true);
  }

  paint(location) {
    location.appendChild(this.node);
  }

  update(content, location) {
    const template = document.createElement('template');
    template.innerHTML = content;
    const newNode = document.importNode(template.content, true);

    const nodeWalker = document.createTreeWalker(location, NodeFilter.SHOW_ALL);
    const newNodeWalker = document.createTreeWalker(newNode, NodeFilter.SHOW_ALL);
    const nodeList = [];
    const newNodeList = [];
    while (nodeWalker.nextNode()) { nodeList.push(nodeWalker.currentNode); }
    while (newNodeWalker.nextNode()) { newNodeList.push(newNodeWalker.currentNode); }

    console.log({ nodeList, newNodeList })
  }
}

export function html(location) {
  return function(strings, ...values) {
    const output = strings.map((string, index) =>
      `${string ? string : ''}${values[index] ? values[index] : ''}`).join('');
    if (!location.__renderer) {
      const renderer = new Template(output);
      renderer.paint(location);
      console.log(typeof location.__renderer)
      location.__renderer = renderer;
      return output;
    } else {
      location.__renderer.update(output, location);
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
