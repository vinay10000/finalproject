// Simple script to start the application with a timeout
// This ensures the server starts even if MongoDB connection is slow

import { spawn } from 'child_process';
import process from 'process';

console.log('Starting the application...');

// Start the server in a child process
const server = spawn('npx', ['tsx', 'server/index.ts'], {
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

// Log that we've started the server
console.log('Server process started');