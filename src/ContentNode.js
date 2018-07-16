import { startSeparator, endSeparator, valuePattern } from './patterns.js';

export class ContentNode {
  constructor(node, compiler) {
    this.node = node;
    this.compiler = compiler;
    this.base = node.nodeValue || '';
    this.indicies = this.base
      .match(valuePattern)
      .map(index => +index.replace(startSeparator, '').replace(endSeparator, ''));
    
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
      values[+match.replace(startSeparator, '').replace(endSeparator, '')]
    );
  }

  update(values) {
    this.node.nodeValue = this.base.replace(/---!{*.}!---/g, match => {
      const value = values[+match.replace(startSeparator, '').replace(endSeparator, '')];
      if (Array.isArray(value)) {
        return value.join('');
      } else {
        return value === null ? '' : value;
      }
    });
  }
}
