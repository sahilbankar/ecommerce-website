const mongoose = require('mongoose');

/**
 * Connect to MongoDB Atlas / local MongoDB instance
 */
const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/ecommerce';
    const conn = await mongoose.connect(mongoUri);
    console.log(`[MongoDB] Connected to database: ${conn.connection.host}/${conn.connection.name}`);
  } catch (error) {
    console.error(`[MongoDB] Database connection error: ${error.message}`);
  }
};

module.exports = connectDB;
