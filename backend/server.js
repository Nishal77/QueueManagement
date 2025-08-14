import { server } from './app.js';
import config from './config/config.js';

const PORT = config.port;

server.listen(PORT, () => {
  console.log(`🚀 QueueManagement Server running on port ${PORT}`);
  console.log(`📊 Environment: ${config.nodeEnv}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`📱 API Base URL: http://localhost:${PORT}/api`);
  console.log(`🌐 Frontend URL: ${config.cors.frontendUrl}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('Process terminated');
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...');
  server.close(() => {
    console.log('Process terminated');
  });
});
