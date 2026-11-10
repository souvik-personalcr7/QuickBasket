import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { createApp } from './app';
import { env } from './config/env';
import { connectDB } from './config/db';
import { initSocketService } from './services/socket.service';
import { verifyEmailConnection } from './services/email.service';

const app = createApp();
const server = http.createServer(app);

// Initialize Socket.IO
export const io = new SocketIOServer(server, {
  cors: {
    origin: (origin, callback) => {
      callback(null, true);
    },
    credentials: true,
  },
});

// Mount authenticated real-time order tracking and rider dispatch service
initSocketService(io);

server.on('error', (err: NodeJS.ErrnoException) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n❌ Error: Port ${env.PORT} is already in use by another process.`);
    console.error(`💡 Tip: Run "npx kill-port ${env.PORT}" or terminate the process using port ${env.PORT}.\n`);
  } else {
    console.error('❌ Server error:', err);
  }
  process.exit(1);
});

const startServer = async () => {
  server.listen(env.PORT, () => {
    console.log(`Server connected successfully on port ${env.PORT}`);
  });

  // Connect to MongoDB
  await connectDB();

  // Verify email service connection
  await verifyEmailConnection();
};

// Handle unhandled rejections
process.on('unhandledRejection', (err) => {
  console.error('💥 Unhandled Rejection:', err);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('💥 Uncaught Exception:', err);
  process.exit(1);
});

startServer();
