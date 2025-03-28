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
      // Pass ID directly, let the storage implementation handle conversion if needed
      const startup = await storage.getStartup(req.params.id);
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
      // Pass ID directly, let the storage implementation handle conversion if needed
      const startup = await storage.getStartupByUserId(req.params.userId);
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
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const requestedUserId = req.params.userId;
    const currentUserId = req.user.id.toString();
    
    // Check if the requested userId is the same as the authenticated user's id
    // For MongoDB IDs, we might need to check if one starts with the other
    if (!(currentUserId === requestedUserId || 
          currentUserId.startsWith(requestedUserId) || 
          requestedUserId.startsWith(currentUserId))) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    try {
      // Pass ID directly, let the storage implementation handle conversion if needed
      const investments = await storage.getUserInvestments(requestedUserId);
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
      // Pass ID directly, let the storage implementation handle conversion if needed
      const updates = await storage.getStartupUpdates(req.params.startupId);
      res.json(updates);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch updates" });
    }
  });
  
  app.get("/api/startups/:startupId/investments", async (req, res) => {
    try {
      // Pass ID directly, let the storage implementation handle conversion if needed
      const investments = await storage.getStartupInvestments(req.params.startupId);
      res.json(investments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch startup investments" });
    }
  });
  
  // Admin route for clearing data - remove in production
  app.delete("/api/admin/clear-startups", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      await storage.clearStartups();
      res.status(200).json({ message: "All startups cleared successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to clear startups" });
    }
  });
  
  // Route to update user's wallet address
  app.patch("/api/user/wallet", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const { walletAddress } = req.body;
    
    if (!walletAddress) {
      return res.status(400).json({ message: "Wallet address is required" });
    }
    
    // Validate Ethereum wallet address format
    const ethereumAddressRegex = /^0x[a-fA-F0-9]{40}$/;
    if (!ethereumAddressRegex.test(walletAddress)) {
      return res.status(400).json({ message: "Invalid Ethereum wallet address format" });
    }
    
    try {
      const user = await storage.updateUserWalletAddress(req.user.id, walletAddress);
      // Don't send password in response
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      if (error instanceof Error && error.message.includes("already in use")) {
        return res.status(400).json({ message: error.message });
      } else if (error instanceof Error && error.message.includes("already been confirmed")) {
        return res.status(400).json({ message: error.message });
      }
      res.status(500).json({ message: "Failed to update wallet address" });
    }
  });
  
  // Route to confirm user's wallet address (can only be done once)
  app.post("/api/user/wallet/confirm", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const { walletAddress } = req.body;
    
    if (!walletAddress) {
      return res.status(400).json({ message: "Wallet address is required" });
    }
    
    // Validate Ethereum wallet address format
    const ethereumAddressRegex = /^0x[a-fA-F0-9]{40}$/;
    if (!ethereumAddressRegex.test(walletAddress)) {
      return res.status(400).json({ message: "Invalid Ethereum wallet address format" });
    }
    
    try {
      const user = await storage.confirmUserWalletAddress(req.user.id, walletAddress);
      // Don't send password in response
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes("does not match")) {
          return res.status(400).json({ message: error.message });
        } else if (error.message.includes("already been confirmed")) {
          return res.status(400).json({ message: error.message });
        }
      }
      res.status(500).json({ message: "Failed to confirm wallet address" });
    }
  });
  
  // Temporary route to get all users - REMOVE BEFORE PRODUCTION
  app.get("/api/admin/users", async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
