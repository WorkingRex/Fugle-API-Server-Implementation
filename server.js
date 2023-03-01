const express = require('express');
const redis = require('redis');
const app = express();
const router = require('./router.js');

const port = 3000;

// 創建Redis客戶端實例
const client = redis.createClient({
	host: "redis://127.0.0.1。"
});

// 連接到Redis服務器
client.connect()
	.catch((err) => {
		console.error('Redis連接失敗：', err);
	})
	.then(() => {
		console.log('Redis連接成功');
	});

// 將Redis客戶端實例添加到應用程序中
app.set('redisClient', client);

app.use('/', router);

app.listen(port, () => {
	console.log(`Server is listening on port ${port}`);
});