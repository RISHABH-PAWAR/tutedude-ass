import { Server } from 'socket.io';
import {
  addUser,
  removeUser,
  getAllUsers,
  getAllUsersRaw,
  getUser,
  removeConnection,
  getUserCount,
} from './state/roomState.js';
import { registerMovementHandlers } from './handlers/movement.js';
import { registerChatHandlers } from './handlers/chat.js';
import { registerWebRTCHandlers } from './handlers/webrtc.js';
import { getRoomId } from './handlers/proximity.js';
import User from '../models/User.js';

export const initSocket = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  io.on('connection', (socket) => {
    console.log(`🔌 Connected: ${socket.id} (total: ${getUserCount() + 1})`);

    socket.on('user:join', async ({ username }) => {
      if (!username || typeof username !== 'string') return;
      const safeName = username.trim().slice(0, 32);

      const x = Math.floor(Math.random() * 1000) + 100;
      const y = Math.floor(Math.random() * 500) + 100;

      addUser(socket.id, safeName, x, y);
      User.create({ socketId: socket.id, username: safeName }).catch(() => {});

      socket.emit('user:joined', {
        userId: socket.id,
        username: safeName,
        x,
        y,
        allUsers: getAllUsers(),
      });

      io.emit('position:broadcast', { users: getAllUsers() });
      console.log(`👤 ${safeName} joined`);
    });

    registerMovementHandlers(io, socket);
    registerChatHandlers(io, socket);
    registerWebRTCHandlers(io, socket);

    socket.on('disconnect', (reason) => {
      const user = getUser(socket.id);
      if (!user) return;

      console.log(`🔴 ${user.username} disconnected (${reason})`);

      const usersMap = getAllUsersRaw();
      for (const [otherId, otherUser] of usersMap.entries()) {
        if (otherUser.connections.has(socket.id)) {
          const roomId = getRoomId(socket.id, otherId);
          removeConnection(socket.id, otherId);
          const otherSocket = io.sockets.sockets.get(otherId);
          if (otherSocket) otherSocket.leave(roomId);
          io.to(otherId).emit('proximity:disconnect', { roomId, peerId: socket.id });
        }
      }

      removeUser(socket.id);
      io.emit('user:disconnected', { socketId: socket.id });
      io.emit('position:broadcast', { users: getAllUsers() });

      User.updateOne({ socketId: socket.id }, { lastSeen: new Date() }).catch(() => {});
    });
  });

  return io;
};
