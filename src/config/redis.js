import "dotenv/config";
import { createClient } from "redis";

const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";
const redisEnabled = (process.env.REDIS_ENABLED || "true").toLowerCase() !== "false";

const redis = createClient({ url: redisUrl });

redis.on("error", (error) => {
    console.error("Redis error:", error.message);
});

const connectRedis = async () => {
    if (!redisEnabled) {
        console.log("Redis disabled by REDIS_ENABLED=false");
        return;
    }

    if (redis.isOpen) return;

    try {
        await redis.connect();
        console.log("Redis connected");
    } catch (error) {
        console.error(`Redis connection error ${error.message}`);
    }
};

const disconnectRedis = async () => {
    if (!redisEnabled) return;
    if (!redis.isOpen) return;

    await redis.quit();
    console.log("Redis disconnected");
};

const getCachedJson = async (key) => {
    if (!redisEnabled || !redis.isOpen) return null;

    try {
        const payload = await redis.get(key);
        return payload ? JSON.parse(payload) : null;
    } catch (error) {
        console.error("Redis getCachedJson error:", error.message);
        return null;
    }
};

const setCachedJson = async (key, value, ttlSeconds) => {
    if (!redisEnabled || !redis.isOpen) return;

    try {
        await redis.set(key, JSON.stringify(value), { EX: ttlSeconds });
    } catch (error) {
        console.error("Redis setCachedJson error:", error.message);
    }
};

const deleteByPrefix = async (prefix) => {
    if (!redisEnabled || !redis.isOpen) return 0;

    try {
        const keys = [];
        for await (const key of redis.scanIterator({ MATCH: `${prefix}*`, COUNT: 100 })) {
            keys.push(key);
        }

        if (keys.length === 0) return 0;
        return await redis.del(keys);
    } catch (error) {
        console.error("Redis deleteByPrefix error:", error.message);
        return 0;
    }
};

export { connectRedis, disconnectRedis, getCachedJson, setCachedJson, deleteByPrefix };
