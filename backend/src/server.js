import http from 'http';
import { Server } from 'socket.io';
import app from './app.js';
import { connectDB, disconnectDB } from './config/db.js';
import { ENV } from './config/env.js';
import { Category } from './models/Category.js';
import { runSeed } from './seeds/seedRunner.js';
import { setupMatchSockets } from './sockets/matchSocket.js';

const server = http.createServer(app);

// Real-Time Socket.IO configuration (FR-03, FR-05)
const io = new Server(server, {
  cors: {
    origin: [ENV.CLIENT_URL, 'http://localhost:5173', 'http://127.0.0.1:5173'],
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

setupMatchSockets(io);

async function start() {
  try {
    await connectDB();
    // Auto-seed if database is brand new and empty
    const count = await Category.countDocuments();
    if (count === 0) {
      console.log('[Database] Empty database detected. Automatically seeding initial categories, questions, and admin...');
      await runSeed();
    }
  } catch (err) {
    console.warn('[Warning] Running server without active database connection. Some routes will fail until MongoDB is started.');
  }

  server.listen(ENV.PORT, () => {
    console.log(`[Server] SkillDuels Backend running on http://localhost:${ENV.PORT}`);
    console.log(`[Server] Health check: http://localhost:${ENV.PORT}/api/health`);
    console.log(`[Server] Environment: ${ENV.NODE_ENV}`);
  });
}

// Graceful shutdown handling
const gracefulShutdown = async (signal) => {
  console.log(`\n[Server] Received ${signal}. Shutting down gracefully...`);
  server.close(async () => {
    console.log('[Server] HTTP server closed.');
    await disconnectDB();
    process.exit(0);
  });
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

start();
