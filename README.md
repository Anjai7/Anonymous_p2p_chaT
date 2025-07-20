# Anonymous Serverless P2P Web Chat

A fully anonymous, peer-to-peer chat and file-sharing web application—no servers, no persistence, no tracking, and nothing left behind after a page reload. Connect and communicate in real time with total privacy, directly in your browser!

## 🚀 Features

- **True Anonymity:** No user registration, no tracking, no analytics, and no cookies.
- **Peer-to-Peer Communication:** Uses WebRTC for direct browser-to-browser chat and file transfers.
- **Absolutely No Data Persistence:** All messages and files exist only in memory and are wiped instantly if the page closes or reloads.
- **Manual Signaling:** No server needed—simply exchange connection codes (offer/answer) to connect peers.
- **Live Messaging:** Real-time text chat, supporting optional nicknames (never tied to identity).
- **Anonymous File Sharing:** Peer-to-peer file transfers (up to 100MB per file) with progress tracking—files are never uploaded or stored.
- **Modern Dark UI:** Responsive and visually appealing interface, fast and optimized for modern browsers.
- **Public & Private:** Anyone can use it, and anyone can host it as static files on Netlify, Vercel, GitHub Pages, or any static host.

## 🛠️ How It Works

1. **Open the App**  
   Each user receives a random session UID and may (optionally) pick a nickname.

2. **Create or Join a Room**  
   - One user creates a session, generates a connection code (offer), and shares it securely.
   - Others join by pasting the offer code, generate an answer, and send it back.
   - Multiple users can connect via manual exchange of codes for a mesh chat.

3. **Chat & File Sharing**  
   All messages and file transfers are fully peer-to-peer via encrypted WebRTC DataChannels.

4. **Ephemeral by Design**  
   Reloading or closing the browser erases everything—no traces left, ever.


