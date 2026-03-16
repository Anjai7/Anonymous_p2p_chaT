import { Redis } from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);
const ROOM_EXPIRE = 3600; // 1 hour

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { roomCode, targetUserId, fromUserId, signal } = req.body;

        if (!roomCode || !targetUserId || !fromUserId || !signal) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Verify the room still exists
        const roomExists = await redis.exists(`room:${roomCode}:members`);
        if (!roomExists) {
            return res.status(404).json({ error: 'Room not found or expired' });
        }

        // Push the signal to the target user's queue
        const signalMessage = JSON.stringify({
            type: 'signal',
            from: fromUserId,
            signal: signal
        });

        await redis.rpush(`room:${roomCode}:signals:${targetUserId}`, signalMessage);
        await redis.expire(`room:${roomCode}:signals:${targetUserId}`, ROOM_EXPIRE);

        return res.status(200).json({ message: 'Signal sent successfully' });
    } catch (error) {
        console.error('Error sending signal:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
