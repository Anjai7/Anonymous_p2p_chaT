import { Redis } from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);
const ROOM_EXPIRE = 3600; // 1 hour

function generateRoomCode() {
    return Math.floor(10000 + Math.random() * 90000).toString();
}

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { userId, nickname } = req.body;

        if (!userId) {
            return res.status(400).json({ error: 'User ID is required' });
        }

        let roomCode;
        let isUnique = false;

        // Generate a unique room code
        while (!isUnique) {
            roomCode = generateRoomCode();
            const exists = await redis.exists(`room:${roomCode}:members`);
            if (!exists) {
                isUnique = true;
            }
        }

        // Add the host to the room members set
        await redis.sadd(`room:${roomCode}:members`, userId);
        await redis.expire(`room:${roomCode}:members`, ROOM_EXPIRE);

        // Also store user info so others can know the nickname
        await redis.hset(`room:${roomCode}:info:${userId}`, 'nickname', nickname || 'Anonymous');
        await redis.expire(`room:${roomCode}:info:${userId}`, ROOM_EXPIRE);

        return res.status(200).json({ roomCode, message: 'Room created successfully' });
    } catch (error) {
        console.error('Error creating room:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
