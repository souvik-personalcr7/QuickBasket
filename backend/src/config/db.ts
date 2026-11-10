import mongoose from 'mongoose';
import dns from 'dns';
import { env } from './env';

// Set public DNS servers to prevent querySrv ECONNREFUSED on Windows networks
try {
  dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
} catch {
  // Ignore if setting DNS servers fails
}

export const connectDB = async (): Promise<void> => {
  try {
    await mongoose.connect(env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection failed');
  }
};
