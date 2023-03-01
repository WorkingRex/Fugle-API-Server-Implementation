/**
 * 取得 user 請求次數
 * @param {import('@redis/client').RedisClientType} client 
 * @param {number} userId 
 * @returns 
 */
async function checkUserRateLimit(client, userId) {
    const key = `user:${userId}`;
    const count = await client.incr(key);
    const ttl = await client.ttl(key);
    if (ttl === -1) {
        await client.expire(key, 60); // 60 秒後計數器自動過期
    }
    return count;
}

/**
 * 取得 ip 請求次數
 * @param {import('@redis/client').RedisClientType} client 
 * @param {number} ip 
 * @returns 
 */
async function checkIPRateLimit(client, ip) {
    const key = `ip:${ip}`;
    const count = await client.incr(key);
    const ttl = await client.ttl(key);
    if (ttl === -1) {
        await client.expire(key, 60); // 60 秒後計數器自動過期
    }
    return count;
}

async function rateLimit(req, res, next) {
    const userId = req.userId;
    const ip = req.ip;
    /** @type {import('@redis/client').RedisClientType} */
    const client = req.app.get('redisClient');

    try {
        const userCount = await checkUserRateLimit(client, userId);
        const ipCount = await checkIPRateLimit(client, ip);
        if (userCount > 5 || ipCount > 10) {
            res.status(429).json({ ip: ipCount, id: userCount });
        } else {
            next();
        }
    } catch (error) {
        console.error(error);
        res.sendStatus(500);
    }
}

module.exports = rateLimit;