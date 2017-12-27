import { startSeparator, endSeparator, valuePattern } from './patterns.js';

export class ContentNode {
  constructor(node) {
    this.node = node;
    this.base = node.nodeValue || '';
    this.index = +this.base
      .match(valuePattern)[0]
      .replace(startSeparator, '')
      .replace(endSeparator, '');
  }

  set value(_value) {
    const newValue = this.base.replace(valuePattern, _value);
    this.value !== newValue ?
      this.node.nodeValue = newValue : null;
  }

  get value() {
    return this.node.nodeValue;
  }

  setValue(value = '') {
    this.node.nodeValue = this.base.replace(valuePattern, value);
  }

  update(values) {
    this.value = values[this.index];
  }
}
