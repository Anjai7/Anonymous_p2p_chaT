# AnonChat - Serverless P2P Encrypted Chat

![AnonChat UI](https://via.placeholder.com/1000x500.png?text=AnonChat+Premium+Glassmorphic+UI)

AnonChat is a frictionless, anonymous, peer-to-peer chat application that runs directly in the browser. It features end-to-end encryption via WebRTC, allowing users to send messages and transfer large files directly to each other without passing through a central server.

We modernized the initial approach (which required manual copy-pasting of huge SDP tokens) by integrating a lightweight **Vercel Serverless + Upstash Redis (ioredis)** signaling backend. This allows users to connect simply by sharing a 5-digit room code!

## ✨ Features

- **True Mesh Peer-to-Peer:** Messages and files are sent directly between browsers using WebRTC `RTCDataChannel`. Supports multi-user rooms via a **Full Mesh Architecture** (everyone connects directly to everyone else).
- **Serverless Signal Router:** Uses Vercel API functions and a Redis backend to automate the complex WebRTC handshake using simple 5-digit room codes, routing offers and ICE candidates between multiple users.
- **End-to-End Encrypted:** Because data flows over WebRTC, everything is encrypted by default using DTLS and SRTP. No servers ever see your messages or files.
- **Unlimited File Sizes:** Transfer massive files at maximum bandwidth since it skips server upload/download bottlenecks.
- **Glassmorphic UI:** A premium, fully responsive dark-mode interface designed with deep CSS variables, glowing accents, and intuitive animations.
- **No Signups Required:** Entirely anonymous. Set an optional display name or just jump straight in.

## 🚀 Tech Stack

- **Frontend:** Vanilla HTML, CSS, JavaScript (No frameworks)
- **WebRTC:** Native browser APIs for `RTCPeerConnection`
- **Backend Signaling:** Vercel Serverless Functions (Node.js)
- **Database:** Redis (via `ioredis`) for ephemeral, temporary signal storage (auto-expiring room codes)

## 🛠️ Local Development

### Prerequisites

1. Node.js (v18+)
2. A free [Redis Database](https://upstash.com/) or local Redis server
3. Vercel CLI (`npm i -g vercel`)

### Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/Anjai7/Anonymous_p2p_chaT.git
   cd Anonymous_p2p_chaT
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env.local` file in the root directory and add your Redis URL:
   ```env
   REDIS_URL="redis://default:YOUR_PASSWORD@your-redis-url.com:PORT"
   ```

4. Run the Vercel development server:
   ```bash
   vercel dev
   ```

5. Open `http://localhost:3000` in two separate browser windows to test the P2P connection!

## 🌐 Deployment

This project is optimized for [Vercel](https://vercel.com). Simply push the repository to GitHub, link it to a new Vercel project, and add your `REDIS_URL` environment variable in the Vercel dashboard.

```bash
# Deploy to production from CLI
vercel --prod
```

## 🔒 Security & Privacy

Since AnonChat uses WebRTC, the signaling server (Redis) only briefly holds the "Offer" and "Answer" SDP tokens (which expire in minutes). Once the connection is established, all traffic (messages & files) flows exclusively between the connected peers.

*Note: As with all P2P applications, connecting implies exposing your IP address to the peer you are connecting with, which is a requirement of WebRTC.*
