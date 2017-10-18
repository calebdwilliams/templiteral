const express     = require('express');
const bodyParser  = require('body-parser');
const port        = process.env.PORT || 4321;
const app         = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static('./'));

app.listen(port, 'localhost');
