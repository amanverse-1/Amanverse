# Amanverse Portfolio & Admin Dashboard

Welcome to the **Amanverse** project! This is a complete Full-Stack MERN (MongoDB, Express, React, Node.js) portfolio website, seamlessly integrated with a secure Admin Dashboard and a Telegram Bot for real-time visitor tracking and notifications.

## 🚀 Features

- **Portfolio Website:** A beautiful, responsive, and modern portfolio with GSAP animations and smooth scrolling.
- **Admin Dashboard (React):** A secured (JWT-authenticated) dashboard to view live visitor stats, charts, and recent contact messages.
- **Real-Time Telegram Bot:** 
  - Instant alerts when someone submits the contact form.
  - Interactive bot commands (e.g., "total visitors", "stats") to get live traffic data straight to your phone.
  - Automated Daily & Weekly visitor reports.
- **Single-Folder Architecture:** Optimized for a seamless **Vercel** deployment where Vite builds the frontend and Vercel automatically handles the Express APIs as Serverless Functions.

## 📂 Project Structure

```text
├── api/                  # Express Backend & Serverless API Routes
│   ├── models/           # MongoDB Mongoose Schemas
│   ├── cron/             # Automated Vercel Cron Jobs (Daily & Weekly)
│   └── index.js          # Main Backend Entry Point & Telegram Webhook
├── src/                  # React Admin Dashboard Source Code
├── public/               # Static Assets & Tracker Script
├── data/                 # Local JSON backup for visitors and messages
├── index.html            # Main Portfolio Website HTML
├── admin.html            # Admin Dashboard Entry HTML
└── vercel.json           # Vercel Configuration & Routing rules
```

## 🛠️ Local Development

To run this project locally, a single command starts both the Vite frontend server and the Express backend server concurrently.

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Setup Environment Variables:**
   Create a `.env` file in the root directory and add:
   ```env
   MONGODB_URI=your_mongodb_connection_string
   TELEGRAM_BOT_TOKEN=your_telegram_bot_token
   TELEGRAM_CHAT_ID=your_telegram_chat_id
   JWT_SECRET=your_jwt_secret_key
   PORT=5000
   ```

3. **Start the Development Server:**
   ```bash
   npm run dev
   ```
   - **Portfolio:** `http://localhost:5173/`
   - **Admin Dashboard:** `http://localhost:5173/admin` (Default Login: `admin@example.com` / `admin123`)

## ☁️ Deployment (Vercel)

This project is fully configured to be deployed on **Vercel**.

1. Import this GitHub repository into Vercel.
2. Add your `.env` variables in the Vercel Dashboard under Settings > Environment Variables.
3. Click **Deploy**.
4. **Activate Telegram Bot:** Once your site is live, visit `https://your-domain.vercel.app/api/set-webhook` just once to link your Telegram bot to the live server.
