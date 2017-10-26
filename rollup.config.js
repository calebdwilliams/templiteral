// import uglify from 'rollup-plugin-uglify-es';

export default {
  input: 'src/templit.js',
  output: [{
    file: 'dist/templit.es.js',
    format: 'es'
  }, {
    file: 'dist/templit.cjs.js',
    format: 'cjs'
  }, {
    file: 'dist/templit.umd.js',
    format: 'umd',
    name: 'templit'
  }, {
    file: 'dist/templit.js',
    format: 'iife',
    name: 'templit'
  }]
};
