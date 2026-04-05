import {
  updatePosition,
  getAllUsers,
  getAllUsersRaw,
  addConnection,
  removeConnection,
} from '../state/roomState.js';
import { calculateProximityChanges, getRoomId } from './proximity.js';

export const registerMovementHandlers = (io, socket) => {
  socket.on('position:update', ({ x, y }) => {
    const clampedX = Math.max(0, Math.min(Number(x) || 0, 1200));
    const clampedY = Math.max(0, Math.min(Number(y) || 0, 700));

    updatePosition(socket.id, clampedX, clampedY);

    io.emit('position:broadcast', { users: getAllUsers() });

    const { toConnect, toDisconnect } = calculateProximityChanges(getAllUsersRaw());

    for (const { a, b } of toConnect) {
      const roomId = getRoomId(a.socketId, b.socketId);
      addConnection(a.socketId, b.socketId);

      const sA = io.sockets.sockets.get(a.socketId);
      const sB = io.sockets.sockets.get(b.socketId);
      if (sA) sA.join(roomId);
      if (sB) sB.join(roomId);

      io.to(a.socketId).emit('proximity:connect', { roomId, peerId: b.socketId, peerName: b.username });
      io.to(b.socketId).emit('proximity:connect', { roomId, peerId: a.socketId, peerName: a.username });
    }

    for (const { a, b } of toDisconnect) {
      const roomId = getRoomId(a.socketId, b.socketId);
      removeConnection(a.socketId, b.socketId);

      const sA = io.sockets.sockets.get(a.socketId);
      const sB = io.sockets.sockets.get(b.socketId);
      if (sA) sA.leave(roomId);
      if (sB) sB.leave(roomId);

      io.to(a.socketId).emit('proximity:disconnect', { roomId, peerId: b.socketId });
      io.to(b.socketId).emit('proximity:disconnect', { roomId, peerId: a.socketId });
    }
  });
};
