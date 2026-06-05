/**
 * Redis configuration — optional caching layer.
 * Requirements: 12.1–12.5
 *
 * Returns a connected ioredis client if REDIS_URL is set, otherwise null.
 * All callers must handle the null case gracefully (no-cache fallback).
 */

import { Redis } from 'ioredis';

let _client: Redis | null = null;

export function getRedisClient(): Redis | null {
    if (!process.env.REDIS_URL) return null;

    if (!_client) {
        _client = new Redis(process.env.REDIS_URL, {
            lazyConnect: false,
            enableReadyCheck: false,
            maxRetriesPerRequest: 1,
        });

        _client.on('error', (err: Error) => {
            console.error('[Redis] Connection error:', err.message);
        });

        _client.on('connect', () => {
            console.log('[Redis] Connected to Redis.');
        });
    }

    return _client;
}

/**
 * Cache helper — tries Redis GET first, falls back to fn(), stores result with TTL.
 * If Redis is unavailable, calls fn() directly (Requirement 12.4).
 */
export async function withCache<T>(
    key: string,
    ttlSeconds: number,
    fn: () => Promise<T>,
): Promise<T> {
    const redis = getRedisClient();

    if (redis) {
        try {
            const cached = await redis.get(key);
            if (cached !== null) {
                return JSON.parse(cached) as T;
            }
        } catch (err) {
            console.error('[Redis] GET error:', err);
        }
    }

    const result = await fn();

    if (redis) {
        try {
            await redis.set(key, JSON.stringify(result), 'EX', ttlSeconds);
        } catch (err) {
            console.error('[Redis] SET error:', err);
        }
    }

    return result;
}
