export const deepEqual = (a, b) => {
  if (a === b) return true;
    
  if (a && b && typeof a == 'object' && typeof b == 'object') {
    const arrA = Array.isArray(a);
    const arrB = Array.isArray(b);
    let i;
    let length;
    let key;
        
    if (arrA && arrB) {
      length = a.length;
      if (length != b.length) return false;
      for (i = length; i-- !== 0;)
        if (!deepEqual(a[i], b[i])) return false;
      return true;
    }
        
    if (arrA != arrB) return false;
        
    const dateA = a instanceof Date;
    const dateB = b instanceof Date;
    if (dateA != dateB) return false;
    if (dateA && dateB) return a.getTime() == b.getTime();
        
    const regexpA = a instanceof RegExp;
    const regexpB = b instanceof RegExp;
    if (regexpA != regexpB) return false;
    if (regexpA && regexpB) return a.toString() == b.toString();
        
    const keys = Object.keys(a);
    length = keys.length;
        
    if (length !== Object.keys(b).length) return false;
        
    for (i = length; i-- !== 0;)
      if (!Object.hasOwnProperty.call(b, keys[i])) return false;

    for (i = length; i-- !== 0;) {
      key = keys[i];
      if (!deepEqual(a[key], b[key])) return false;
    }

    return true;
  } else if (a && b && typeof a == 'function' && typeof b == 'function') {
    // ignore functions for our purposes
    return true;
  }
    
  return a!==a && b!==b;
};

export const protectProperty = (target, prop, value) => Object.defineProperty(target, prop, {
  value,
  enumerable: false,
  configurable: false,
  writable: false
});

export const protectGet = (target, prop, get) => Object.defineProperty(target, prop, {
  get,
  configurable: false,
  enumerable: false
});

export const rendererSymbol = Symbol('Renderer');
export const repeaterSymbol = Symbol('Repeater');
export const removeSymbol = Symbol('RemoveTemplate');
export const valueToInt = match => +match.replace(/(---!{)|(}!---)/gi, '');
export const toEventName = match => match.replace(/(\()|(\))/gi, '');
export const nullProps = (context, props) => props.forEach(prop => context[prop] = null);
