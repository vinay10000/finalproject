import mongoose from 'mongoose';
import { log } from '../vite';

let connectionPromise: Promise<typeof mongoose> | null = null;

export async function connectToMongoDB(): Promise<typeof mongoose> {
  if (connectionPromise) {
    return connectionPromise;
  }

  if (!process.env.MONGODB_URI) {
    const error = new Error('MONGODB_URI environment variable is not set');
    log(error.message, 'mongodb');
    throw error;
  }

  const mongoURI = process.env.MONGODB_URI;
  
  log(`Attempting to connect to MongoDB with URI: ${mongoURI.substring(0, 20)}...`, 'mongodb');
  
  try {
    connectionPromise = mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 30000, // 30 seconds timeout
      connectTimeoutMS: 30000, // 30 seconds connection timeout
      socketTimeoutMS: 45000, // 45 seconds socket timeout
      heartbeatFrequencyMS: 10000 // Heartbeat frequency
    })
      .then((mongoose) => {
        log(`Successfully connected to MongoDB`, 'mongodb');
        return mongoose;
      })
      .catch((err) => {
        const errorMessage = err.message || 'Unknown MongoDB connection error';
        log(`Error connecting to MongoDB: ${errorMessage}`, 'mongodb');
        
        if (err.name === 'MongoServerSelectionError') {
          log('Could not select a MongoDB server. Please check your connection string and network.', 'mongodb');
        }
        
        if (err.name === 'MongoNetworkError') {
          log('Network error occurred when connecting to MongoDB. Please check your internet connection.', 'mongodb');
        }
        
        connectionPromise = null;
        throw err;
      });

    return connectionPromise;
  } catch (err) {
    connectionPromise = null;
    const error = err instanceof Error ? err : new Error(String(err));
    log(`MongoDB connection failed: ${error.message}`, 'mongodb');
    throw error;
  }
}

export function getMongoDBConnection(): Promise<typeof mongoose> {
  if (!connectionPromise) {
    return connectToMongoDB();
  }
  return connectionPromise;
}

export async function disconnectFromMongoDB(): Promise<void> {
  if (mongoose.connection.readyState) {
    await mongoose.disconnect();
    log('Disconnected from MongoDB', 'mongodb');
  }
}

// Handle application shutdown gracefully
process.on('SIGINT', async () => {
  await disconnectFromMongoDB();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await disconnectFromMongoDB();
  process.exit(0);
});