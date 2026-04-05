import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  socketId: { type: String, required: true, index: true },
  username: { type: String, required: true, trim: true, maxlength: 32 },
  joinedAt: { type: Date, default: Date.now },
  lastSeen: { type: Date, default: Date.now },
});

export default mongoose.model('User', userSchema);
