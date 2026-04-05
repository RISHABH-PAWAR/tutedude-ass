export const registerWebRTCHandlers = (io, socket) => {
  socket.on('webrtc:offer', ({ targetId, offer, roomId }) => {
    io.to(targetId).emit('webrtc:offer', { fromId: socket.id, offer, roomId });
  });
  socket.on('webrtc:answer', ({ targetId, answer, roomId }) => {
    io.to(targetId).emit('webrtc:answer', { fromId: socket.id, answer, roomId });
  });
  socket.on('webrtc:ice-candidate', ({ targetId, candidate, roomId }) => {
    io.to(targetId).emit('webrtc:ice-candidate', { fromId: socket.id, candidate, roomId });
  });
};
