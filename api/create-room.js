import { kv } from '@vercel/kv';

function generateRoomCode() {
    return Math.floor(10000 + Math.random() * 90000).toString(); // 5-digit code
}

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { offer, nickname, userId } = req.body;

        if (!offer) {
            return res.status(400).json({ error: 'Offer is required' });
        }

        let roomCode;
        let isUnique = false;

        // Generate a unique room code
        while (!isUnique) {
            roomCode = generateRoomCode();
            const exists = await kv.exists(`room:${roomCode}`);
            if (!exists) {
                isUnique = true;
            }
        }

        const roomData = {
            offer,
            nickname,
            userId,
            answer: null,
            createdAt: Date.now()
        };

        // Store room data with an expiration of 15 minutes
        await kv.set(`room:${roomCode}`, roomData, { ex: 900 });

        return res.status(200).json({ roomCode, message: 'Room created successfully' });
    } catch (error) {
        console.error('Error creating room:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
