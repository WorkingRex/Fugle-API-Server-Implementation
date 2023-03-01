const express = require('express');
const router = express.Router();
const axios = require('axios');
const {
	checkUserId,
	rateLimit
} = require('./middleware');

router.get('/data', checkUserId, rateLimit, async (req, res) => {
	try {
		const response = await axios.get(`https://hacker-news.firebaseio.com/v0/topstories.json?print=pretty`);
		res.json(response.data);
	} catch (error) {
		console.error(error);
		res.sendStatus(500);
	}
});

module.exports = router;