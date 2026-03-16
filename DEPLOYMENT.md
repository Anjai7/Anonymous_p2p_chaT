# Deployment Guide for AnonChat

This guide covers how to set up AnonChat for local development and how to deploy it to production using Vercel.

## 🛠️ Local Development

### Prerequisites

1.  **Node.js**: Ensure you have Node.js installed (v18 or higher is recommended).
2.  **Vercel CLI**: Install the Vercel command-line interface globally:
    ```bash
    npm i -g vercel
    ```
3.  **Redis Database**: You need a Redis instance. The easiest way is to use a free serverless Redis database from [Upstash](https://upstash.com/).

### Setup Instructions

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/Anjai7/Anonymous_p2p_chaT.git
    cd Anonymous_p2p_chaT
    ```

2.  **Install dependencies:**
    The backend uses `ioredis` to communicate with the Redis database.
    ```bash
    npm install
    ```

3.  **Configure Environment Variables:**
    Create a `.env.local` file in the root directory of the project. Retrieve your Redis Connection URL (it should start with `redis://` or `rediss://`) from your Upstash console and add it:
    ```env
    REDIS_URL="redis://default:YOUR_PASSWORD@your-redis-url.com:PORT"
    ```

4.  **Run the local development server:**
    Use the Vercel CLI to spin up the local environment. This will emulate the serverless functions locally.
    ```bash
    vercel dev
    ```

5.  **Test the Application:**
    Open `http://localhost:3000` in your browser. To test the P2P connection, open another browser window or an incognito tab, create a room in the first window, and join it using the 5-digit code in the second window.

---

## 🌐 Production Deployment

This project is optimized for incredibly simple deployment on [Vercel](https://vercel.com).

### Method 1: Deploying via GitHub (Recommended)

1.  Push your code to a GitHub repository.
2.  Log in to [Vercel](https://vercel.com) and click **Add New... > Project**.
3.  Import your GitHub repository.
4.  In the "Environment Variables" section during setup, add your `REDIS_URL`:
    *   **Name:** `REDIS_URL`
    *   **Value:** `redis://default:YOUR_PASSWORD@your-redis-url.com:PORT`
5.  Click **Deploy**. Vercel will automatically build and deploy the application.

### Method 2: Deploying via CLI

If you prefer using the command line, you can deploy directly using the Vercel CLI.

1.  Ensure you are logged into the Vercel CLI:
    ```bash
    vercel login
    ```
2.  Run the production deployment command:
    ```bash
    vercel --prod
    ```
3.  The CLI will prompt you to set up the project. Once completed, remember to go to your Vercel Project Dashboard online, navigate to **Settings > Environment Variables**, and add your `REDIS_URL`. You may need to trigger one more deployment for the variables to take effect.
