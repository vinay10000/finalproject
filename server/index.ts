import dotenv from "dotenv";
// Load environment variables from .env file
dotenv.config();

import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { connectToMongoDB } from "./db/mongodb";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Start MongoDB connection attempt but don't wait for it
  if (process.env.MONGODB_URI) {
    log(`Attempting to connect to MongoDB with URI: ${process.env.MONGODB_URI.substring(0, 20)}...`, 'server');
    
    // Set up MongoDB connection in background
    connectToMongoDB()
      .then(() => {
        log('Connected to MongoDB successfully', 'server');
      })
      .catch((error) => {
        log(`Failed to connect to MongoDB: ${error instanceof Error ? error.message : String(error)}`, 'server');
        log('Falling back to in-memory storage', 'server');
      });
  } else {
    log('MONGODB_URI environment variable is not set, using in-memory storage', 'server');
  }
  
  // Continue with server setup immediately without waiting for MongoDB
  const server = await registerRoutes(app);
  
  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  
  // Add 404 handler for any undefined routes
  app.use(notFoundHandler);
  
  // Add global error handler
  app.use(errorHandler);

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
