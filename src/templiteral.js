import { Template } from './Template.js';

const templateCache = new Map();

function html(location) {
  return function(strings, ...values) {
    const output = strings.map((string, index) =>
      `${string ? string : ''}${values[index] ? '---!{' + values[index] + '}!---' : ''}`).join('');
    const templateKey = btoa(strings.join(''));

    let compiler = templateCache.get(templateKey);

    if (compiler) {
      compiler.update(output);
    } else {
      compiler = new Template(output, location, this);
      templateCache.set(templateKey, compiler);
    }
  };
}

export function templiteral(location, context) {
  function render(...args) {
    const renderer = Reflect.apply(html, context, [location]);
    return Reflect.apply(renderer, context, args);
  }
  return render.bind(context);
}
