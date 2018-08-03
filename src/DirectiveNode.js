import { Template } from './Template.js';
import { removeSymbol, repeaterSymbol } from './patterns.js';

export class DirectiveNode {
  constructor(node, value, context, compiler, index) {
    this.node = node;
    this.values = value;
    this.context = context;
    this.compiler = compiler;
    this.index = index;
    this.templateMap = null;
    this.compiler.partIndicies.set(index, this);
    this.node[repeaterSymbol] = [];
    this.repeater = this.node[repeaterSymbol];
    this.group = Symbol('Group');
  }

  init() {
    this.templates = this.values.map((value, index) => {
      const [strings, values] = value;
      const { $$key } = values;
      if (this.templateMap === null) {
        if (typeof $$key !== 'string' && typeof $$key !== 'number') {
          this.templateMap = new WeakMap();
        } else {
          this.templateMap = new Map();
        }
      }
      let template;
      if (this.templateMap.has($$key)) {
        template = this.templateMap.get($$key);
        template.update(values);
      } else {
        template = new Template(strings, values, this.node, this.context, this.group, index);
        this.templateMap.set($$key, template);
      }
      this.node[this.group].set(index, template);
      this.repeater.push(...template.nodes);
      return template;
    });
  }

  update(values) {
    const newValues = values[this.index];
    const oldValues = this.values;
    this.values = newValues;
    const activeKeys = new Set(this.values.map(([, value]) => value.$$key));
    const previousKeys = new Set(oldValues.map(([, value]) => value.$$key));
    const newKeys = new Set();

    activeKeys.forEach(key => {
      previousKeys.has(key) ? null : newKeys.add(key);
    });

    previousKeys.forEach(key => {
      const template = this.templateMap.get(key);
      if (template && !activeKeys.has(key)) {
        template[removeSymbol]();
        this.templateMap.delete(key);
      }
    });
    this.init();
  }
}
