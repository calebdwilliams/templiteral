import { matchPattern, valuePattern, valueToInt } from './patterns.js';

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

  update(values) {
    this.node.nodeValue = this.base.replace(matchPattern, match => 
      values[valueToInt(match)] === null ? '' : values[valueToInt(match)]
    );
  }
}
