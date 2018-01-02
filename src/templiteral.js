import { Template } from './Template.js';

const templateCache = new Map();

export function templiteral(location = this, context = this) {
  location.shadowRoot ? location = location.shadowRoot : null;

  return (strings, ...values) => {
    const templateKey = (strings.join(''));
    let compiler = templateCache.get(templateKey);

    if (compiler) {
      compiler.update(values);
    } else {
      compiler = new Template(strings, values, location, context);
      templateCache.set(templateKey, compiler);
    }

    return compiler;
  };
}
