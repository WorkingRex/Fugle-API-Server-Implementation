const WebSocket = require('ws');
var redisClient = null;

const currencyPairs = ["btcusd", "btceur", "btcgbp", "btcpax", "gbpusd", "gbpeur", "eurusd", "xrpusd", "xrpeur", "xrpbtc", "xrpgbp", "ltcbtc", "ltcusd", "ltceur", "ltcgbp", "ethbtc", "ethusd", "etheur", "ethgbp", "ethpax", "bchusd", "bcheur", "bchbtc", "paxusd", "xlmbtc", "xlmusd", "xlmeur", "xlmgbp", "linkusd", "linkeur", "linkgbp", "linkbtc", "omgusd", "omgeur", "omggbp", "omgbtc", "usdcusd", "usdceur", "btcusdc", "ethusdc", "eth2eth", "aaveusd", "aaveeur", "aavebtc", "batusd", "bateur", "umausd", "umaeur", "daiusd", "kncusd", "knceur", "mkrusd", "mkreur", "zrxusd", "zrxeur", "gusdusd", "algousd", "algoeur", "algobtc", "audiousd", "audioeur", "audiobtc", "crvusd", "crveur", "snxusd", "snxeur", "uniusd", "unieur", "unibtc", "yfiusd", "yfieur", "compusd", "compeur", "grtusd", "grteur", "lrcusd", "lrceur", "usdtusd", "usdteur", "usdcusdt", "btcusdt", "ethusdt", "xrpusdt", "eurteur", "eurtusd", "flrusd", "flreur", "manausd", "manaeur", "maticusd", "maticeur", "sushiusd", "sushieur", "chzusd", "chzeur", "enjusd", "enjeur", "hbarusd", "hbareur", "alphausd", "alphaeur", "axsusd", "axseur", "sandusd", "sandeur", "storjusd", "storjeur", "adausd", "adaeur", "adabtc", "fetusd", "feteur", "sklusd", "skleur", "slpusd", "slpeur", "sxpusd", "sxpeur", "sgbusd", "sgbeur", "avaxusd", "avaxeur", "dydxusd", "dydxeur", "ftmusd", "ftmeur", "shibusd", "shibeur", "ampusd", "ampeur", "ensusd", "enseur", "galausd", "galaeur", "perpusd", "perpeur", "wbtcbtc", "ctsiusd", "ctsieur", "cvxusd", "cvxeur", "imxusd", "imxeur", "nexousd", "nexoeur", "antusd", "anteur", "godsusd", "godseur", "radusd", "radeur", "bandusd", "bandeur", "injusd", "injeur", "rlyusd", "rlyeur", "rndrusd", "rndreur", "vegausd", "vegaeur", "1inchusd", "1incheur", "solusd", "soleur", "apeusd", "apeeur", "mplusd", "mpleur", "dotusd", "doteur", "nearusd", "neareur", "dogeusd", "dogeeur"]

// 計算 OHLC
function calculateOHLC(trades) {
    const open = trades[0].price;
    const close = trades[trades.length - 1].price;
    let high = -Infinity;
    let low = Infinity;

    for (const trade of trades) {
        if (trade.price > high) {
            high = trade.price;
        }
        if (trade.price < low) {
            low = trade.price;
        }
    }

    return [open, high, low, close];
}

class BitstampWebSocket {
    constructor(currencyPair) {
        this.currencyPair = currencyPair;
        this.socket = null;
        this.callback = null;
    }

    connect() {
        this.socket = new WebSocket('wss://ws.bitstamp.net');

        this.socket.on('open', () => {
            console.log(`${this.currencyPair} Connected to Bitstamp WebSocket`);

            // 訂閱 Ticker 頻道
            this.socket.send(JSON.stringify({
                "event": "bts:subscribe",
                "data": {
                    "channel": `live_trades_${this.currencyPair}`
                }
            }));

            // 計時器，每秒執行一次
            setInterval(async () => {
                // 獲取最近 1 分鐘內的交易數據
                const key = `${this.currencyPair}-trades:${Math.round(Date.now() / 60000)}`;

                var trades = await redisClient.lRange(key, 0, -1);

                if (!trades || trades.length === 0) {
                    // console.log('No trades in the last minute');
                    return;
                }

                trades = trades.map(t => JSON.parse(t));

                // 計算 OHLC
                const ohlc = calculateOHLC(trades);
                console.log(`${this.currencyPair}-OHLC:`, ohlc);

                // 保存 OHLC 數據到 Redis 中
                const ohlcKey = `${this.currencyPair}-ohlc:${Math.round(Date.now() / 60000)}`;

                await redisClient.set(ohlcKey, JSON.stringify({
                    open: ohlc[0],
                    high: ohlc[1],
                    low: ohlc[2],
                    close: ohlc[3]
                }));

                // 將 OHLC 鍵的過期時間設置為 1 分鐘後
                await redisClient.expire(ohlcKey, 60);
            }, 1000);
        });

        // 監聽新交易事件
        this.socket.on('message', async (data) => {
            try {
                const message = JSON.parse(data);
                if (message.channel === `live_trades_${this.currencyPair}`) {
                    if (message.event != "trade")
                        return;

                    // 將交易數據保存到 Redis 中
                    const trade = {
                        price: parseFloat(message.data.price),
                        amount: parseFloat(message.data.amount)
                    };

                    const key = `${this.currencyPair}-trades:${Math.round(Date.now() / 60000)}`;
                    await redisClient.lPush(key, JSON.stringify(trade));
                    await redisClient.expire(key, 60);
                    
                    const ohlcKey = `${this.currencyPair}-ohlc:${Math.round(Date.now() / 60000)}`;
                    var OHLC = JSON.parse(await redisClient.get(ohlcKey));
                    this.callback({
                        currency_pair: this.currencyPair,
                        trade,
                        open: OHLC?.open,
                        high: OHLC?.high,
                        low: OHLC?.low,
                        close: OHLC?.close
                    });
                }
            } catch (err) {
                console.error(err);
            }
        });
    }

    onReceive(callback) {
        this.callback = callback;
    }
}

/**
 * 
 * @param {*} client 
 * @param {import('./clientWebsocketRouter')} webSocketRouter 
 * @returns 
 */
module.exports = (client, webSocketRouter) => {
    redisClient = client;

    var currencyPairWebSockets = {};
    currencyPairs.forEach(currencyPair => {
        var currencyPairWebSocket = new BitstampWebSocket(currencyPair);
        currencyPairWebSocket.connect();
        currencyPairWebSocket.onReceive((data) => {
            webSocketRouter.broadcastToChannel(currencyPair, data);
        });
        currencyPairWebSockets[currencyPair] = currencyPairWebSocket;
    });

    return currencyPairWebSockets;
}