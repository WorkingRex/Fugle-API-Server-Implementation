const express = require('express');
const redis = require('redis');
const app = express();
const expressWs = require('express-ws')(app);

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

const clientWebsocketRouter = require('./websocket/clientWebsocketRouter');
const websocketRouter = new clientWebsocketRouter();
// 在 express 路由中設定 WebSocket 路由
app.ws('/streaming', (ws, req) => {
	websocketRouter.handleConnection(ws, req);
});

const bitstampWSs = require('./websocket/bitstampWebsocket')(client, websocketRouter);
app.set("bitstampWSs", bitstampWSs);

app.listen(port, () => {
	console.log(`Server is listening on port ${port}`);
});