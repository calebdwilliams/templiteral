// import uglify from 'rollup-plugin-uglify-es';

export default {
  input: 'src/templiteral.js',
  output: [{
    file: 'dist/templiteral.es.js',
    format: 'es'
  }, {
    file: 'dist/templiteral.cjs.js',
    format: 'cjs'
  }, {
    file: 'dist/templiteral.umd.js',
    format: 'umd',
    name: 'templit'
  }, {
    file: 'dist/templiteral.js',
    format: 'iife',
    name: 'templit'
  }]
};
