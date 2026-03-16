import { Redis } from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { roomCode, answer, nickname, userId } = req.body;

        if (!roomCode || !answer) {
            return res.status(400).json({ error: 'Room code and answer are required' });
        }

        const dataStr = await redis.get(`room:${roomCode}`);
        const roomData = dataStr ? JSON.parse(dataStr) : null;

        if (!roomData) {
            return res.status(404).json({ error: 'Room not found or expired' });
        }

        if (roomData.answer) {
            return res.status(400).json({ error: 'Answer already submitted for this room' });
        }

        // Update the room data
        roomData.answer = answer;
        roomData.answerNickname = nickname;
        roomData.answerUserId = userId;

        // Save back with remaining expiration (we'll just reset it to 5 mins as connection is established quickly)
        await redis.set(`room:${roomCode}`, JSON.stringify(roomData), 'EX', 300);

        return res.status(200).json({ message: 'Answer submitted successfully' });
    } catch (error) {
        console.error('Error submitting answer:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
