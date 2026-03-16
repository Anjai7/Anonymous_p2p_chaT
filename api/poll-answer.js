import { Redis } from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

export default async function handler(req, res) {
    // Prevent caching — this endpoint must always return fresh data
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

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
            return res.status(200).json({
                hasAnswer: true,
                answer: roomData.answer,
                nickname: roomData.answerNickname,
                userId: roomData.answerUserId
            });
        }

        return res.status(200).json({ hasAnswer: false });
    } catch (error) {
        console.error('Error polling answer:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
