export const debounce = (fn, wait, immediate) => {
  let timeout;

  return function executed(...args) {
    const context = this;
    
    const later = () => {
      timeout = null;
      !immediate && Reflect.apply(fn, context, args);
    };

    const callNow = immediate && !timeout;

    clearTimeout(timeout);

    timeout = setTimeout(later, wait);

    callNow && Reflect.apply(fn, context, args);
  };
};
