import jwt from 'jsonwebtoken';
import { ENV } from '../config/env.js';
import { Question } from '../models/Question.js';
import { User } from '../models/User.js';

function shuffle(list) {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[j], a[i]] = [a[i], a[j]];
  }
  return a;
}

export function setupMatchSockets(io) {
  // Category matchmaking queues: categoryId -> Array<{ socketId, user }>
  const queues = new Map();
  // Active match lookup: socketId -> matchId
  const playerMatches = new Map();

  // Socket authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) {
        return next(new Error('Authentication token required'));
      }

      const decoded = jwt.verify(token, ENV.JWT_SECRET);
      const user = await User.findById(decoded.id).select('name avatarColor xp role').lean();
      if (!user) {
        return next(new Error('User not found'));
      }

      socket.user = {
        id: user._id.toString(),
        name: user.name,
        avatarColor: user.avatarColor,
        xp: user.xp,
      };
      next();
    } catch (err) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const me = socket.user;

    // Join matchmaking queue (FR-03)
    socket.on('queue:join', async ({ categoryId }) => {
      if (!categoryId) return;

      if (!queues.has(categoryId)) {
        queues.set(categoryId, []);
      }
      const queue = queues.get(categoryId);

      // Remove any existing queue entry for this user
      const existingIdx = queue.findIndex((item) => item.user.id === me.id);
      if (existingIdx !== -1) queue.splice(existingIdx, 1);

      // If an opponent is waiting in the queue
      if (queue.length > 0) {
        const opponentEntry = queue.shift();
        const opponentSocket = io.sockets.sockets.get(opponentEntry.socketId);

        if (opponentSocket && opponentSocket.connected) {
          const matchId = `m_${Math.random().toString(36).slice(2, 9)}${Date.now().toString(36).slice(-3)}`;
          const room = `match:${matchId}`;

          socket.join(room);
          opponentSocket.join(room);

          playerMatches.set(socket.id, matchId);
          playerMatches.set(opponentSocket.id, matchId);

          // Fetch questions
          const pool = await Question.find({ categoryId, status: 'published' }).lean();
          const questions = shuffle(pool).slice(0, 6).map((item) => {
            const order = shuffle(item.options.map((text, i) => ({ text, i })));
            return {
              id: item.id,
              categoryId: item.categoryId,
              text: item.text,
              difficulty: item.difficulty,
              options: order.map((o) => o.text),
              answer: order.findIndex((o) => o.i === item.answer),
            };
          });

          // Notify both players
          socket.emit('match:found', {
            matchId,
            questions,
            opponent: opponentEntry.user,
          });

          opponentSocket.emit('match:found', {
            matchId,
            questions,
            opponent: me,
          });

          return;
        }
      }

      // Nobody in queue, push this player
      queue.push({ socketId: socket.id, user: me });
    });

    // Leave matchmaking queue
    socket.on('queue:leave', ({ categoryId }) => {
      if (categoryId && queues.has(categoryId)) {
        const queue = queues.get(categoryId);
        const idx = queue.findIndex((item) => item.socketId === socket.id);
        if (idx !== -1) queue.splice(idx, 1);
      }
    });

    // Send answer to opponent (FR-05)
    socket.on('match:answer', ({ matchId, ...payload }) => {
      if (!matchId) return;
      socket.to(`match:${matchId}`).emit('match:opponentAnswer', payload);
    });

    // Player forfeits / leaves match
    socket.on('match:leave', ({ matchId }) => {
      if (!matchId) return;
      socket.to(`match:${matchId}`).emit('match:opponentLeft');
      socket.leave(`match:${matchId}`);
      playerMatches.delete(socket.id);
    });

    // Disconnect cleanup (NFR-04)
    socket.on('disconnect', () => {
      // Remove from all queues
      for (const [, queue] of queues.entries()) {
        const idx = queue.findIndex((item) => item.socketId === socket.id);
        if (idx !== -1) queue.splice(idx, 1);
      }

      // Check if user was in a match and notify opponent
      const matchId = playerMatches.get(socket.id);
      if (matchId) {
        socket.to(`match:${matchId}`).emit('match:opponentLeft');
        playerMatches.delete(socket.id);
      }
    });
  });
}
