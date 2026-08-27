const dotenv = require('dotenv');

// Load environment variables before any other imports
dotenv.config();

const app = require('./app');
const connectDB = require('./config/db');

// Handle Uncaught Exceptions
process.on('uncaughtException', (err) => {
  console.error('[CRITICAL] Uncaught Exception:', err.name, err.message);
  console.error(err.stack);
  process.exit(1);
});

// Connect Database and Start HTTP Server
const PORT = process.env.PORT || 5000;

let server;

const startServer = async () => {
  try {
    await connectDB();

    server = app.listen(PORT, () => {
      console.log(`[Server] Server is running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    });
  } catch (error) {
    console.error('[Server] Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();

// Handle Unhandled Promise Rejections
process.on('unhandledRejection', (err) => {
  console.error('[CRITICAL] Unhandled Promise Rejection:', err.name, err.message);
  if (server) {
    server.close(() => {
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
});
