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

## 📁 Architecture Overview

The application is structured into two main parts:

### 1. Frontend (`index.html`, `style.css`, `app.js`)
- **UI:** A modern, responsive interface built with HTML5 and native CSS variables for easy theming.
- **WebRTC Logic (`app.js`):** Manages the `RTCPeerConnection` lifecycle. It handles:
  - Requesting microphone/camera access (if extended).
  - Creating and handling WebRTC Offers, Answers, and ICE Candidates.
  - Managing `RTCDataChannel` connections for text messages and file transfers.
  - Dynamically creating new peer connections when multiple users join the same room.

### 2. Backend Signaling (`/api/`)
The backend is completely stateless, running on Vercel Edge/Serverless functions. It acts as a temporary "mailbox" router for WebRTC signals.
- `create-room.js`: Generates a unique 5-digit code and creates a Redis Set for the room.
- `join-room.js`: Adds a new user to the room and broadcasts a generic `peer-joined` event to all existing members.
- `send-signal.js`: Routes specific WebRTC payloads (Offers, Answers, ICE Candidates) to a target user's specific signaling queue.
- `poll-signals.js`: A long-polling endpoint where the frontend continuously checks for new messages in its private queue.

## 🔒 Security & Privacy

Since AnonChat uses WebRTC, the signaling server (Redis) only briefly holds the "Offer" and "Answer" SDP tokens (which expire in minutes). Once the connection is established, all traffic (messages & files) flows exclusively between the connected peers.

*Note: As with all P2P applications, connecting implies exposing your IP address to the peer you are connecting with, which is a requirement of WebRTC.*

## 📖 Deployment Instructions

Please refer to the [DEPLOYMENT.md](DEPLOYMENT.md) file for comprehensive instructions on how to set up the Redis database, configure environment variables, run the project locally, and deploy it to Vercel production.
