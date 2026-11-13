import mongoose from 'mongoose';
import dns from 'dns';

// Fix querySrv ECONNREFUSED on Windows networks for mongodb+srv://
function setPublicDNS() {
  try {
    dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
  } catch {
    // Ignore in environments where setting DNS servers is not allowed
  }
}

setPublicDNS();

const MONGODB_URI =
  process.env.MONGODB_URI ||
  'mongodb+srv://souvikdas9111_db_user:sPRU79NyhUr1BBJW@cluster0.xnatmfx.mongodb.net/quickbasket';

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache | undefined;
}

let cached: MongooseCache = global.mongooseCache || { conn: null, promise: null };

if (!global.mongooseCache) {
  global.mongooseCache = cached;
}

async function attemptConnect(retries = 3): Promise<typeof mongoose> {
  setPublicDNS();
  const opts: mongoose.ConnectOptions = {
    bufferCommands: false,
    serverSelectionTimeoutMS: 8000,
  };

  try {
    return await mongoose.connect(MONGODB_URI, opts);
  } catch (err: any) {
    if (retries > 1 && (err.code === 'ECONNREFUSED' || err.message?.includes('querySrv'))) {
      try {
        dns.setServers(['1.1.1.1', '8.8.8.8']);
      } catch {}
      await new Promise((res) => setTimeout(res, 400));
      return attemptConnect(retries - 1);
    }
    throw err;
  }
}

export async function connectDB(): Promise<typeof mongoose> {
  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = attemptConnect(3).then((mongooseInstance) => {
      return mongooseInstance;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}
