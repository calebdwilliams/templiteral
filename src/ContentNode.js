import { startSeparator, endSeparator, valuePattern, valueToInt } from './patterns.js';

export class ContentNode {
  constructor(node, compiler) {
    this.node = node;
    this.compiler = compiler;
    this.base = node.nodeValue || '';
    this.indicies = this.base
      .match(valuePattern)
      .map(valueToInt);
    
    this.indicies.forEach(index => this.compiler.partIndicies.set(index, this));
  }

  set value(_value) {
    const newValue = this.base.replace(valuePattern, _value);
    this.value !== newValue ?
      this.node.nodeValue = newValue : null;
  }

  get value() {
    return this.node.nodeValue;
  }

  setValue(values = []) {
    this.node.nodeValue = this.base.replace(/---!{*.}!---/g, (match) => 
      values[valueToInt(match)]
    );
  }

  update(values) {
    this.node.nodeValue = this.base.replace(/---!{*.}!---/g, match => {
      const value = values[valueToInt(match)];
      if (Array.isArray(value)) {
        return value.join('');
      } else {
        return value === null ? '' : value;
      }
    });
  }
}
