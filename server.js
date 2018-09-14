/* eslint-env node */
'use strict'; 

const express     = require('express');
const compression = require('compression');
const rollup      = require('express-middleware-rollup');
const bodyParser  = require('body-parser');
const port        = process.env.PORT || 4321;
const app         = express();

app.use(express.static('./static/scripts'));

app.use(compression());

app.use(rollup({
  src: 'src',
  dest: './static',
  bundleExtension: '.js',
  type: 'application/javascript',
  rebuild: 'always',
  serve: 'on-compile',
  bundleOpts: {
    format: 'es',
  }
}));

app.use(express.static('./static'));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use((request, res, next) => {
  console.log(`${request.method}: \t ${request.url}`);
  next();
});

app.listen(port);
