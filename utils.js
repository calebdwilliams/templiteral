/* eslint-env node */
const isProd = (isTrue, isFalse = () => {}) => process.env.NODE_ENV === 'production' ? isTrue : isFalse;

const noop = () => {};

module.exports = { isProd, noop };
