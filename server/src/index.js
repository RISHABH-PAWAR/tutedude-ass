import 'dotenv/config';
import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import connectDB from './config/db.js';
import healthRouter from './routes/health.js';
import { initSocket } from './socket/index.js';

const app = express();
const server = http.createServer(app);

app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  methods: ['GET', 'POST'],
  credentials: true,
}));
app.use(express.json());

app.use('/health', healthRouter);

initSocket(server);

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🌍 ENV: ${process.env.NODE_ENV}`);
  });
}).catch((err) => {
  console.error('❌ DB connection failed:', err.message);
  console.log('⚠️ Running server without DB connection...');
  server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT} (No DB)`);
  });
});
