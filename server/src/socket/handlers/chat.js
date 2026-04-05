import Message from '../../models/Message.js';
import { getUser } from '../state/roomState.js';

export const registerChatHandlers = (io, socket) => {
  socket.on('chat:message', async ({ roomId, text }) => {
    const user = getUser(socket.id);
    if (!user || !roomId || typeof text !== 'string') return;

    const trimmed = text.trim().slice(0, 500);
    if (!trimmed || !socket.rooms.has(roomId)) return;

    const message = {
      roomId,
      senderId: socket.id,
      senderName: user.username,
      text: trimmed,
      timestamp: new Date().toISOString(),
    };

    io.to(roomId).emit('chat:receive', message);
    Message.create(message).catch(err => console.error('Message save error:', err.message));
  });

  socket.on('chat:request_history', async ({ roomId }) => {
    if (!socket.rooms.has(roomId)) return;
    try {
      const messages = await Message.find({ roomId })
        .sort({ timestamp: 1 })
        .limit(50)
        .lean();
      socket.emit('chat:history', { roomId, messages });
    } catch (err) {
      console.error('History fetch error:', err.message);
    }
  });
};
