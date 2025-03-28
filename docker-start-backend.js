// Docker backend startup script
import { spawn } from 'child_process';
import process from 'process';

console.log('Starting the backend service in Docker environment...');

// Set environment variable for Docker
process.env.NODE_ENV = 'production';

// Start the server
const server = spawn('tsx', ['server/index.ts'], {
  stdio: 'inherit'
});

// Handle server process events
server.on('error', (err) => {
  console.error(`Failed to start server process: ${err}`);
  process.exit(1);
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('Received SIGINT. Gracefully shutting down...');
  server.kill('SIGINT');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('Received SIGTERM. Gracefully shutting down...');
  server.kill('SIGTERM');
  process.exit(0);
});

console.log('Backend service started successfully');