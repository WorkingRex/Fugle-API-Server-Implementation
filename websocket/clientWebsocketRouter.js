
class WebSocketRouter {
    constructor() {
        this.clients = new Set();
    }

    handleConnection(ws, req) {
        console.log('WebSocket connection established');

        // 將 WebSocket 連線加入 clients 集合
        this.clients.add(ws);

        ws.on('message', (message) => {
            if(!message) return;
            var msgJson = JSON.parse(message);

            if(msgJson.event === "subscribe"){
                this.subscribe(ws, msgJson.data?.channels);
            }
            else if(msgJson.event === "unsubscribe"){
                this.unsubscribe(ws, msgJson.data?.channels);
            }

            console.log(msgJson);
        });

        ws.on('close', () => {
            console.log('WebSocket connection closed');

            // 從 clients 集合中移除關閉的 WebSocket 連線
            this.clients.delete(ws);
        });
    }

    broadcast(data) {
        for (const client of this.clients) {
            if (client.readyState === client.OPEN) {
                client.send(JSON.stringify(data));
            }
        }
    }

    subscribe(ws, channels) {
        ws.channels = ws.channels || new Set();

        if(Array.isArray(channels)){
            channels.forEach(channel => ws.channels.add(channel));
        }
    }

    unsubscribe(ws, channels) {
        if (ws.channels && Array.isArray(channels)) {
            channels.forEach(channel => ws.channels.delete(channel));
        }
    }

    broadcastToChannel(channel, data) {
        for (const client of this.clients) {
            if (client.readyState === client.OPEN && client.channels && client.channels.has(channel)) {
                client.send(JSON.stringify(data));
            }
        }
    }
}

module.exports = WebSocketRouter;