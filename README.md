# VibeMeet 🚀

<div align="center">
  <img src="frontend/public/vibemeet-live-call-hero.png" alt="VibeMeet hero" width="600"/>
</div>

**VibeMeet** is a premium, real‑time video‑chat matchmaking platform that connects users with shared interests. It combines a sleek, glass‑morphism UI with robust backend services, secure authentication, admin broadcasting, and AI‑powered moderation.

---

## Badges

[![License](https://img.shields.io/github/license/Amankr0075/VibeMeet)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-20.x-green)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18.x-blue)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-5.x-yellow)](https://vitejs.dev/)
[![MongoDB Atlas](https://img.shields.io/badge/MongoDB-Atlas-47A248)](https://www.mongodb.com/atlas)

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Variables](#environment-variables)
  - [Running the Project](#running-the-project)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

---

## Features

- **Real‑time user matching** with WebRTC video calls
- **AI moderation** using Groq to keep conversations safe
- **Admin broadcasting** (email + in‑app notifications)
- **Premium UI**: dark mode, glass‑morphism, micro‑animations
- **Responsive design** for desktop and mobile
- **Secure authentication** (JWT, password hashing)
- **Scalable backend** on MongoDB Atlas

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, TypeScript, Vite, Tailwind‑CSS (custom utilities), Socket.io client |
| Backend | Node.js, Express, TypeScript, Socket.io server, Mongoose, JWT |
| Database | MongoDB Atlas (SRV connection) |
| AI/Moderation | Groq API (LLM moderation endpoint) |
| DevOps | Vercel (frontend), Ngrok (local backend tunnel) |

---

## Getting Started

### Prerequisites

- **Node.js** (v20 or later) – [download](https://nodejs.org/)
- **Git** – [download](https://git-scm.com/)
- **MongoDB Atlas** account (free tier is fine) – create a cluster and obtain the connection string.
- **Groq API key** – for moderation (store it only in `.env`).

### Installation

```bash
# Clone the repo
git clone https://github.com/Amankr0075/VibeMeet.git
cd VibeMeet

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### Environment Variables

Create a `.env` file in the **backend** folder (it is already ignored by Git):

```dotenv
# MongoDB Atlas connection (replace <username>, <password>, <cluster>, etc.)
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/VibeMeet?retryWrites=true&w=majority

# JWT secret – use a strong random string
JWT_SECRET=your_very_secret_key

# Groq moderation API key (optional – if you want AI moderation)
GROQ_API_KEY=your_groq_key
```

> **Important:** Do **not** commit `.env` – it is listed in `.gitignore`.

### Running the Project

Open two terminal windows (or use VS Code split terminals):

```bash
# Backend – from the repository root
cd backend
npm run dev   # watches TypeScript files and starts the server on http://localhost:5000
```

```bash
# Frontend – from the repository root
cd frontend
npm run dev   # Vite dev server on http://localhost:5173
```

The app will be fully functional locally. The frontend talks to the backend via the `VITE_API_URL` environment variable (defaults to `http://localhost:5000`).

---

## Deployment

1. **Frontend (Vercel)**
   - Sign in to Vercel with your GitHub account.
   - Import the `VibeMeet` repository.
   - Set the *Root Directory* to `frontend`.
   - Add the following Production environment variables, using the current public HTTPS URL of the tunnel running on your laptop (without a trailing slash):
     ```dotenv
     VITE_API_URL=https://your-current-tunnel.ngrok-free.app
     VITE_SOCKET_URL=https://your-current-tunnel.ngrok-free.app
     ```
   - Deploy – Vercel will automatically build and serve the app.

2. **Backend (Ngrok – quick local deployment)**
   ```bash
   # With the backend running on port 5000
   ngrok http 5000
   ```
   - Copy the generated HTTPS URL and add it as both `VITE_API_URL` and `VITE_SOCKET_URL` in Vercel, then redeploy. The tunnel URL changes each time a free ngrok tunnel is restarted, so update both Vercel variables whenever that happens.
   - For a production‑grade backend you can host it on Render, Railway, or any VPS.

---

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository.
2. Create a feature branch (`git checkout -b feature/awesome-feature`).
3. Make your changes, ensuring the code follows the existing style.
4. Write/Update tests if applicable.
5. Commit with clear messages and push to your fork.
6. Open a Pull Request describing the changes.

---

## License

This project is licensed under the **MIT License** – see the `LICENSE` file for details.

---

*Crafted with 💜 by the VibeMeet team*
