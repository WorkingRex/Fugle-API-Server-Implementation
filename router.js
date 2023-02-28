const express = require('express');
const router = express.Router();
const axios = require('axios');

router.get('/data', async (req, res) => {
  res.send("hello");
});

module.exports = router;