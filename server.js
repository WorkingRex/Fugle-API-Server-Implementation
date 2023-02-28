const express = require('express');
const app = express();
const router = require('./router.js');

const port = 3000;

app.use('/', router);

app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});