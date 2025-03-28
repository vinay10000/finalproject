import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);

  // API routes
  // Startups routes
  app.get("/api/startups", async (req, res) => {
    try {
      const startups = await storage.getStartups();
      res.json(startups);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch startups" });
    }
  });

  app.get("/api/startups/:id", async (req, res) => {
    try {
      const startup = await storage.getStartup(parseInt(req.params.id));
      if (!startup) {
        return res.status(404).json({ message: "Startup not found" });
      }
      res.json(startup);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch startup details" });
    }
  });
  
  app.get("/api/users/:userId/startup", async (req, res) => {
    try {
      const startup = await storage.getStartupByUserId(parseInt(req.params.userId));
      if (!startup) {
        return res.status(404).json({ message: "Startup not found for this user" });
      }
      res.json(startup);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch startup details" });
    }
  });

  app.post("/api/startups", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    if (req.user.userType !== "startup") {
      return res.status(403).json({ message: "Only startup accounts can create startup profiles" });
    }

    try {
      const startupData = {
        ...req.body,
        userId: req.user.id
      };
      
      const startup = await storage.createStartup(startupData);
      res.status(201).json(startup);
    } catch (error) {
      res.status(500).json({ message: "Failed to create startup" });
    }
  });

  // Investments routes
  app.post("/api/investments", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    if (req.user.userType !== "investor") {
      return res.status(403).json({ message: "Only investors can make investments" });
    }

    try {
      const investmentData = {
        ...req.body,
        investorId: req.user.id
      };
      
      const investment = await storage.createInvestment(investmentData);
      
      // Update startup funding
      await storage.updateStartupFunding(
        investment.startupId, 
        investment.amount
      );
      
      res.status(201).json(investment);
    } catch (error) {
      res.status(500).json({ message: "Failed to process investment" });
    }
  });

  app.get("/api/users/:userId/investments", async (req, res) => {
    if (!req.isAuthenticated() || req.user.id !== parseInt(req.params.userId)) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    try {
      const investments = await storage.getUserInvestments(parseInt(req.params.userId));
      res.json(investments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch investments" });
    }
  });

  // Updates routes
  app.post("/api/updates", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    if (req.user.userType !== "startup") {
      return res.status(403).json({ message: "Only startups can post updates" });
    }

    try {
      // Verify the startup belongs to the user
      const startup = await storage.getStartupByUserId(req.user.id);
      if (!startup) {
        return res.status(404).json({ message: "Startup profile not found" });
      }

      const updateData = {
        ...req.body,
        startupId: startup.id
      };
      
      const update = await storage.createUpdate(updateData);
      res.status(201).json(update);
    } catch (error) {
      res.status(500).json({ message: "Failed to create update" });
    }
  });

  app.get("/api/startups/:startupId/updates", async (req, res) => {
    try {
      const updates = await storage.getStartupUpdates(parseInt(req.params.startupId));
      res.json(updates);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch updates" });
    }
  });
  
  app.get("/api/startups/:startupId/investments", async (req, res) => {
    try {
      const investments = await storage.getStartupInvestments(parseInt(req.params.startupId));
      res.json(investments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch startup investments" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
