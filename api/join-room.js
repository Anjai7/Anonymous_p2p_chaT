import { Redis } from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { roomCode } = req.query;

        if (!roomCode) {
            return res.status(400).json({ error: 'Room code is required' });
        }

        const dataStr = await redis.get(`room:${roomCode}`);
        const roomData = dataStr ? JSON.parse(dataStr) : null;

        if (!roomData) {
            return res.status(404).json({ error: 'Room not found or expired' });
        }

        if (roomData.answer) {
            return res.status(400).json({ error: 'Room is already full' });
        }

        return res.status(200).json({
            offer: roomData.offer,
            nickname: roomData.nickname,
            userId: roomData.userId
        });
    } catch (error) {
        console.error('Error joining room:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
