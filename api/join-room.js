import { Redis } from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);
const ROOM_EXPIRE = 3600; // 1 hour

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { roomCode, userId, nickname } = req.body;

        if (!roomCode || !userId) {
            return res.status(400).json({ error: 'Room code and user ID are required' });
        }

        const roomExists = await redis.exists(`room:${roomCode}:members`);
        if (!roomExists) {
            return res.status(404).json({ error: 'Room not found or expired' });
        }

        // Get existing members to send them a notification
        const members = await redis.smembers(`room:${roomCode}:members`);

        // Push a 'peer-joined' signal to every existing member's queue
        for (const member of members) {
            if (member !== userId) {
                const signalMessage = JSON.stringify({
                    type: 'peer-joined',
                    from: userId,
                    nickname: nickname || 'Anonymous'
                });
                await redis.rpush(`room:${roomCode}:signals:${member}`, signalMessage);
                await redis.expire(`room:${roomCode}:signals:${member}`, ROOM_EXPIRE);
            }
        }

        // Add the new user to the members list
        await redis.sadd(`room:${roomCode}:members`, userId);

        // Store user info
        await redis.hset(`room:${roomCode}:info:${userId}`, 'nickname', nickname || 'Anonymous');
        await redis.expire(`room:${roomCode}:info:${userId}`, ROOM_EXPIRE);

        return res.status(200).json({
            message: 'Joined room successfully',
            existingMembers: members
        });
    } catch (error) {
        console.error('Error joining room:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
