const templates = new Map();
const separator = '{{separator}}';



function buildTemplate(strings, values) {
  const template = document.createElement('template');
  const output = strings.map((string, index) =>
    `${string ? string : ''}${values[index] ? values[index] : ''}`).join('');
  template.innerHTML = output;
  return template;
}

function htmlTag(strings, values, templates) {
  const key = btoa(strings.join(separator));
  let htmlTemplate = { content: '' };

  if (templates.get(key)) {
    htmlTemplate = templates.get(key).htmlTemplate;
  }

  const newTemplate = buildTemplate(strings, values);

  templates.set(key, {
    strings,
    values,
    htmlTemplate: newTemplate });

  return newTemplate;
}

export function render(result, location) {
  if (!location.__templateResult) {
    location.__templateResult = result;
  }
  const output = document.importNode(location.__templateResult.content, true));
  location.appendChild(output);
}

export const html = (strings, ...values) => htmlTag(strings, values, templates);
