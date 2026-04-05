import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  roomId: { type: String, required: true, index: true },
  senderId: { type: String, required: true },
  senderName: { type: String, required: true },
  text: { type: String, required: true, maxlength: 500 },
  timestamp: { type: Date, default: Date.now },
});

messageSchema.index({ timestamp: 1 }, { expireAfterSeconds: 86400 });

export default mongoose.model('Message', messageSchema);
