# RapidChat

> **Real-time Communication Platform with AI Intelligence** 

[![Node.js](https://img.shields.io/badge/Node.js-18+-green)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-19+-blue)](https://react.dev/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Latest-green)](https://www.mongodb.com/)
 

---

## Overview

**RapidChat** is a modern, full-featured communication platform combining real-time messaging, AI-powered conversations, and multimedia capabilities. Built with a scalable microservices architecture, it delivers seamless chat experiences with intelligent features.

### Key Highlights

✨ **Real-Time Messaging** - Instant message delivery with Socket.io  
🤖 **AI Integration** - Smart AI responses with RAG capabilities  
🎥 **Video Calls** - High-quality peer-to-peer video communication  
📱 **Group Chat** - Organize conversations in collaborative groups  
🎙️ **Voice Features** - Speech-to-text and audio message support  
⚡ **High Performance** - Redis caching and optimized queries  
🔐 **Secure** - JWT authentication and encrypted connections  
📄 **Document Support** - PDF handling and processing  

---

## Tech Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB
- **Cache**: Redis
- **Real-time**: Socket.io
- **Media**: Cloudinary
- **AI/ML**: Embeddings & RAG Engine

### Frontend
- **Framework**: React 19+
- **Build Tool**: Vite
- **State Management**: Redux
- **Styling**: Tailwind CSS
- **Media Upload**: Multer
- **HTTP Client**: Axios

### DevOps
- **Containerization**: Docker
- **Orchestration**: Docker Compose
- **Deployment**: Vercel (Frontend)

---

## Project Structure

```
RapidChat/
├── backend/                  # Node.js Express Server
│   ├── src/
│   │   ├── controllers/      # Request handlers
│   │   ├── models/           # MongoDB schemas
│   │   ├── routes/           # API routes
│   │   ├── middleware/       # Auth, cache, file upload
│   │   ├── lib/              # Utilities & services
│   │   │   ├── rag/          # RAG pipeline
│   │   │   ├── socket.js     # WebSocket config
│   │   │   ├── db.js         # Database connection
│   │   │   └── redisClient.js # Cache layer
│   │   └── index.js          # App entry point
│   ├── Dockerfile            # Docker config
│   └── package.json          # Dependencies
│
├── frontend/                 # React Vite App
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   ├── pages/            # Page components
│   │   ├── redux/            # State management
│   │   ├── store/            # Custom hooks
│   │   ├── lib/              # Utilities
│   │   └── main.jsx          # App entry
│   ├── vite.config.js        # Vite configuration
│   └── package.json          # Dependencies
│
└── readme.md                 # This file
```

---

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- Redis (optional, for caching)
- Docker (optional)

### Installation

#### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/RapidChat.git
cd RapidChat
```

#### 2. Backend Setup
```bash
cd backend
npm install

# Configure environment variables
cp .env.example .env
# Edit .env with your configuration

npm run dev
```

#### 3. Frontend Setup
```bash
cd frontend
npm install

# Configure environment variables
cp .env.example .env

npm run dev
```

#### 4. Using Docker (Optional)
```bash
cd backend
docker-compose up --build
```

---

## Environment Configuration

### Backend (.env)
```env
PORT=5000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/rapidchat
REDIS_URL=redis://localhost:6379
CLOUDINARY_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
JWT_SECRET=your_jwt_secret
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:5000
VITE_SOCKET_URL=http://localhost:5000
```

---

## Core Features

### 💬 Real-Time Messaging
- Send and receive messages instantly
- Typing indicators
- Message read receipts
- Media sharing support

### 🤖 AI Chat
- Context-aware responses using RAG
- Document embeddings
- Semantic search
- PDF processing and Q&A

### 👥 Group Chat
- Create and manage groups
- Role-based permissions
- Group notifications
- Invite system

### 🎥 Video Calling
- Peer-to-peer video calls
- Screen sharing capabilities
- Call history and logs

### 📊 Stream Support
- Live streaming capabilities
- Stream management
- Real-time broadcast

### 🎙️ Voice Features
- Speech-to-text transcription
- Audio message recording
- Voice call support

---

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout

### Messages
- `GET /api/messages/:userId` - Fetch messages
- `POST /api/messages/send` - Send message
- `GET /api/messages/:messageId` - Get message

### Groups
- `GET /api/groups` - List all groups
- `POST /api/groups/create` - Create group
- `POST /api/groups/:groupId/messages` - Send group message

### AI
- `POST /api/ai/chat` - AI chat endpoint
- `POST /api/ai/embed` - Generate embeddings
- `POST /api/ai/search` - Semantic search

---

## Running Tests

```bash
cd backend
npm test

cd frontend
npm test
```

---

## Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---
  

##  Tips & Tricks

- **Performance**: Enable Redis caching for faster queries
- **Scaling**: Use Docker Compose for multi-container orchestration
- **Development**: Hot reload enabled for both backend and frontend 

---
 



 

<div align="center">

**THANK YOU**

</div>
