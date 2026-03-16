import { Redis } from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);
const ROOM_EXPIRE = 3600; // 1 hour

export default async function handler(req, res) {
    // Prevent caching — this endpoint must always return fresh data
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { roomCode, userId } = req.query;

        if (!roomCode || !userId) {
            return res.status(400).json({ error: 'Room code and user ID are required' });
        }

        // Refresh the room expiration so active polling keeps it alive
        await redis.expire(`room:${roomCode}:members`, ROOM_EXPIRE);

        // Pop all messages from the user's queue
        // LPOP with count is supported in newer Redis/ioredis. Let's use it or fallback to a multi transaction.
        let messages = await redis.lpop(`room:${roomCode}:signals:${userId}`, 10);

        if (!messages) {
            return res.status(200).json({ signals: [] });
        }

        // Force conversion to array if a single message is returned as a string by `lpop`
        if (!Array.isArray(messages)) {
            messages = [messages];
        }

        const parsedSignals = messages.map(msg => JSON.parse(msg));

        return res.status(200).json({ signals: parsedSignals });
    } catch (error) {
        console.error('Error polling signals:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
