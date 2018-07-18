// import { templiteral } from './templiteral';
import { Template } from './Template';
import { removeSymbol } from './patterns';

export class DirectiveNode {
  constructor(node, value, context, compiler, index) {
    this.node = node;
    this.values = value;
    this.context = context;
    this.compiler = compiler;
    this.index = index;
    this.templateMap = new Map();
    this.compiler.partIndicies.set(index, this);
  }

  init() {
    this.templates = this.values.map(value => {
      const $$key = value[1].$$key;
      let template;
      if (this.templateMap.has($$key)) {
        template = this.templateMap.get($$key);
      } else {
        template = new Template(value[0], value[1], this.node.parentNode, this.context);
        this.templateMap.set($$key, template);
      }
      return template;
    });
  }

  update(values) {
    const newValues = values[this.index];
    const oldValues = this.values;
    this.values = newValues;
    const activeKeys = new Set(this.values.map(value => value[1].$$key));
    const previousKeys = new Set(oldValues.map(value => value[1].$$key));

    if (activeKeys.size < previousKeys.size) {
      activeKeys.forEach(key => previousKeys.delete(key));
      previousKeys.forEach(key => {
        const template = this.templateMap.get(key);
        template[removeSymbol]();
        this.templateMap.delete(key);
      });
    }

    if (newValues.length !== oldValues.length) {
      this.init();
    } else {
      this.templates.forEach((template, index) => {
        template.update(values[this.index][index][1]);
      });
    }
  }
}