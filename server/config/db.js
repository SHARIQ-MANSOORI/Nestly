const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/nestly';
    const isProd = process.env.NODE_ENV === 'production';
    
    // Attempt standard connection
    try {
      const conn = await mongoose.connect(mongoUri, {
        serverSelectionTimeoutMS: isProd ? 10000 : 5000,
      });
      console.log(`[Database] MongoDB Connected: ${conn.connection.host}`);
      return conn;
    } catch (primaryErr) {
      if (isProd) {
        throw primaryErr;
      }

      console.warn(`[Database] Primary Mongo connection (${mongoUri}) failed: ${primaryErr.message}`);
      console.log(`[Database] Initializing In-Memory MongoDB Server...`);
      
      const { MongoMemoryServer } = require('mongodb-memory-server');
      const mongoServer = await MongoMemoryServer.create();
      const memUri = mongoServer.getUri();
      
      const conn = await mongoose.connect(memUri);
      console.log(`[Database] In-Memory Mongo Connected: ${conn.connection.host}`);
      return conn;
    }
  } catch (error) {
    console.error(`[Database] Connection Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
