import mongoose from 'mongoose';
import { ENV } from './env.js';

export async function connectDB(customUri = null) {
  const uri = customUri || ENV.MONGO_URI;

  try {
    const conn = await mongoose.connect(uri, {
      maxPoolSize: 50,
      minPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    console.log(`[Database] MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (err) {
    console.error(`[Database Error] Connection failed: ${err.message}`);
    if (ENV.NODE_ENV !== 'test') {
      console.warn('[Database] Note: Ensure MongoDB is running locally or provide a valid MONGO_URI in .env');
    }
    throw err;
  }
}

export async function disconnectDB() {
  try {
    await mongoose.connection.close();
    console.log('[Database] MongoDB connection closed');
  } catch (err) {
    console.error(`[Database Error] Disconnect failed: ${err.message}`);
  }
}
