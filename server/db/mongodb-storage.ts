import mongoose from 'mongoose';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import { IStorage } from '../storage';
import { User, InsertUser, Startup, InsertStartup, Investment, InsertInvestment, Update, InsertUpdate, Milestone, InsertMilestone } from '@shared/schema';
import { getMongoDBConnection } from './mongodb';
import { UserModel, StartupModel, InvestmentModel, UpdateModel, MilestoneModel, documentToUser, documentToStartup, documentToInvestment, documentToUpdate, documentToMilestone } from './models';
import { log } from '../vite';

export class MongoDBStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    // Set up a memory store initially as a fallback
    const MemoryStore = require('memorystore')(session);
    const memorySessionStore = new MemoryStore({
      checkPeriod: 86400000 // Clear expired sessions every 24h
    });
    
    // First set the session store to memory store, so we always have a fallback
    this.sessionStore = memorySessionStore;
    
    try {
      // Try to set up MongoDB session store
      this.sessionStore = MongoStore.create({
        clientPromise: getMongoDBConnection()
          .then(mongoose => {
            log('MongoDB session store connected successfully', 'mongodb');
            return mongoose.connection.getClient();
          })
          .catch(err => {
            log(`Session store error: ${err.message}`, 'mongodb');
            // Fallback to memory store if MongoDB connection fails
            this.sessionStore = memorySessionStore;
            throw err;
          }),
        ttl: 14 * 24 * 60 * 60, // 14 days in seconds
        autoRemove: 'native',
        touchAfter: 24 * 3600, // Only update session once per day to reduce writes
      });
    } catch (error) {
      log(`Error creating MongoDB session store: ${error instanceof Error ? error.message : String(error)}`, 'mongodb');
      // We already set up the memory store as fallback, just log the error
    }
  }
  
  async updateUserEmail(userId: number | string, email: string): Promise<User> {
    try {
      const updatedUser = await UserModel.findByIdAndUpdate(
        userId,
        { email },
        { new: true }
      );
      
      if (!updatedUser) {
        throw new Error(`User with ID ${userId} not found`);
      }
      
      return documentToUser(updatedUser);
    } catch (error) {
      log(`Error updating user email: ${error}`);
      throw error;
    }
  }
  
  async updateUserPassword(userId: number | string, password: string): Promise<User> {
    try {
      const updatedUser = await UserModel.findByIdAndUpdate(
        userId,
        { password },
        { new: true }
      );
      
      if (!updatedUser) {
        throw new Error(`User with ID ${userId} not found`);
      }
      
      return documentToUser(updatedUser);
    } catch (error) {
      log(`Error updating user password: ${error}`);
      throw error;
    }
  }
  
  async deleteUser(userId: number | string): Promise<void> {
    try {
      const result = await UserModel.findByIdAndDelete(userId);
      
      if (!result) {
        throw new Error(`User with ID ${userId} not found`);
      }
      
      // Could also delete related data like investments
      // await InvestmentModel.deleteMany({ investorId: userId });
      
    } catch (error) {
      log(`Error deleting user: ${error}`);
      throw error;
    }
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    try {
      const user = await UserModel.findById(id);
      return user ? documentToUser(user) : undefined;
    } catch (error) {
      log(`Error getting user by ID: ${error instanceof Error ? error.message : String(error)}`, 'mongodb');
      return undefined;
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      const user = await UserModel.findOne({ username });
      return user ? documentToUser(user) : undefined;
    } catch (error) {
      log(`Error getting user by username: ${error instanceof Error ? error.message : String(error)}`, 'mongodb');
      return undefined;
    }
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    try {
      const user = await UserModel.findOne({ email });
      return user ? documentToUser(user) : undefined;
    } catch (error) {
      log(`Error getting user by email: ${error instanceof Error ? error.message : String(error)}`, 'mongodb');
      return undefined;
    }
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    try {
      // Check if a wallet address is provided and if it's already in use
      if (insertUser.walletAddress) {
        const existingUserWithWallet = await UserModel.findOne({ walletAddress: insertUser.walletAddress });
        if (existingUserWithWallet) {
          throw new Error('Wallet address is already in use by another account');
        }
      }
      
      const newUser = new UserModel(insertUser);
      const savedUser = await newUser.save();
      return documentToUser(savedUser);
    } catch (error) {
      log(`Error creating user: ${error instanceof Error ? error.message : String(error)}`, 'mongodb');
      throw error;
    }
  }
  
  async updateUserWalletAddress(userId: number | string, walletAddress: string): Promise<User> {
    try {
      // First get the user to check if wallet is already confirmed
      const user = await UserModel.findById(userId.toString());
      
      if (!user) {
        throw new Error("User not found");
      }
      
      // If wallet is already confirmed, don't allow changes
      if (user.walletConfirmed) {
        throw new Error("Wallet address has already been confirmed and cannot be changed");
      }
      
      // Check if wallet address is already in use by another user
      const existingUserWithWallet = await UserModel.findOne({ 
        walletAddress, 
        _id: { $ne: userId.toString() } 
      });
      
      if (existingUserWithWallet) {
        throw new Error("Wallet address is already in use by another account");
      }
      
      // Update the user's wallet address
      const updatedUser = await UserModel.findByIdAndUpdate(
        userId.toString(),
        { walletAddress },
        { new: true } // Return the updated document
      );
      
      if (!updatedUser) {
        throw new Error("User not found");
      }
      
      return documentToUser(updatedUser);
    } catch (error) {
      log(`Error updating user wallet address: ${error instanceof Error ? error.message : String(error)}`, 'mongodb');
      throw error;
    }
  }
  
  async confirmUserWalletAddress(userId: number | string, walletAddress: string): Promise<User> {
    try {
      // First get the user to check conditions
      const user = await UserModel.findById(userId.toString());
      
      if (!user) {
        throw new Error("User not found");
      }
      
      // Check if the wallet address matches the current one
      if (user.walletAddress !== walletAddress) {
        throw new Error("Wallet address does not match the stored address");
      }
      
      // Check if wallet is already confirmed
      if (user.walletConfirmed) {
        throw new Error("Wallet address has already been confirmed");
      }
      
      // Confirm the wallet address
      const updatedUser = await UserModel.findByIdAndUpdate(
        userId.toString(),
        { walletConfirmed: true },
        { new: true } // Return the updated document
      );
      
      if (!updatedUser) {
        throw new Error("User not found");
      }
      
      return documentToUser(updatedUser);
    } catch (error) {
      log(`Error confirming user wallet address: ${error instanceof Error ? error.message : String(error)}`, 'mongodb');
      throw error;
    }
  }
  
  async getAllUsers(): Promise<User[]> {
    try {
      const users = await UserModel.find();
      return users.map(documentToUser);
    } catch (error) {
      log(`Error getting all users: ${error instanceof Error ? error.message : String(error)}`, 'mongodb');
      return [];
    }
  }

  // Startup methods
  async getStartups(): Promise<Startup[]> {
    try {
      const startups = await StartupModel.find().sort({ createdAt: -1 });
      return startups.map(documentToStartup);
    } catch (error) {
      log(`Error getting startups: ${error instanceof Error ? error.message : String(error)}`, 'mongodb');
      return [];
    }
  }

  async getStartup(id: number | string): Promise<Startup | undefined> {
    try {
      // Check if this is a partial MongoDB ObjectID from a path split
      // MongoDB ObjectIDs are 24 characters, but URL paths can split them
      // So if we have a partial ID starting with known prefix, try to fetch all startups and find the matching one
      const idString = id.toString();
      
      // If this looks like a valid ObjectID, try to find it directly
      if (idString.length === 24) {
        const startup = await StartupModel.findById(idString);
        return startup ? documentToStartup(startup) : undefined;
      } else {
        // If it looks like a partial ID, try to find all startups and match it
        const allStartups = await this.getStartups();
        const matchingStartup = allStartups.find(s => s.id.toString().startsWith(idString));
        return matchingStartup;
      }
    } catch (error) {
      log(`Error getting startup by ID: ${error instanceof Error ? error.message : String(error)}`, 'mongodb');
      return undefined;
    }
  }

  async getStartupByUserId(userId: number | string): Promise<Startup | undefined> {
    try {
      const startup = await StartupModel.findOne({ userId: userId.toString() });
      return startup ? documentToStartup(startup) : undefined;
    } catch (error) {
      log(`Error getting startup by user ID: ${error instanceof Error ? error.message : String(error)}`, 'mongodb');
      return undefined;
    }
  }

  async createStartup(insertStartup: InsertStartup): Promise<Startup> {
    try {
      const newStartup = new StartupModel({
        ...insertStartup,
        currentFunding: 0,
        photoUrl: insertStartup.photoUrl || null,
        videoUrl: insertStartup.videoUrl || null,
        upiId: insertStartup.upiId || null,
        upiQrUrl: insertStartup.upiQrUrl || null
      });
      const savedStartup = await newStartup.save();
      return documentToStartup(savedStartup);
    } catch (error) {
      log(`Error creating startup: ${error instanceof Error ? error.message : String(error)}`, 'mongodb');
      throw error;
    }
  }

  async updateStartupFunding(startupId: number | string, amount: number): Promise<Startup> {
    try {
      const idString = startupId.toString();
      let startup;
      
      // If this looks like a valid ObjectID, try to update it directly
      if (idString.length === 24) {
        startup = await StartupModel.findByIdAndUpdate(
          idString,
          { $inc: { currentFunding: amount } },
          { new: true }
        );
      } else {
        // If it looks like a partial ID, try to find the full startup first
        const matchingStartup = await this.getStartup(idString);
        if (matchingStartup) {
          startup = await StartupModel.findByIdAndUpdate(
            matchingStartup.id,
            { $inc: { currentFunding: amount } },
            { new: true }
          );
        }
      }
      
      if (!startup) {
        throw new Error("Startup not found");
      }
      
      return documentToStartup(startup);
    } catch (error) {
      log(`Error updating startup funding: ${error instanceof Error ? error.message : String(error)}`, 'mongodb');
      throw error;
    }
  }
  
  async clearStartups(): Promise<void> {
    try {
      await StartupModel.deleteMany({});
      log('All startups cleared successfully', 'mongodb');
    } catch (error) {
      log(`Error clearing startups: ${error instanceof Error ? error.message : String(error)}`, 'mongodb');
      throw error;
    }
  }

  // Investment methods
  async getInvestments(): Promise<Investment[]> {
    try {
      const investments = await InvestmentModel.find().sort({ createdAt: -1 });
      return investments.map(documentToInvestment);
    } catch (error) {
      log(`Error getting investments: ${error instanceof Error ? error.message : String(error)}`, 'mongodb');
      return [];
    }
  }

  async getInvestment(id: number | string): Promise<Investment | undefined> {
    try {
      const idString = id.toString();
      
      // If this looks like a valid ObjectID, try to find it directly
      if (idString.length === 24) {
        const investment = await InvestmentModel.findById(idString);
        return investment ? documentToInvestment(investment) : undefined;
      } else {
        // If it looks like a partial ID, try to find all investments and match it
        const allInvestments = await this.getInvestments();
        const matchingInvestment = allInvestments.find(s => s.id.toString().startsWith(idString));
        return matchingInvestment;
      }
    } catch (error) {
      log(`Error getting investment by ID: ${error instanceof Error ? error.message : String(error)}`, 'mongodb');
      return undefined;
    }
  }

  async getUserInvestments(userId: number | string): Promise<Investment[]> {
    try {
      const idString = userId.toString();
      
      // If this looks like a valid ObjectID, try to find investments directly
      if (idString.length === 24) {
        const investments = await InvestmentModel.find({ investorId: idString }).sort({ createdAt: -1 });
        return investments.map(documentToInvestment);
      } else {
        // If it's a partial ID, try to find the user first and then their investments
        const users = await UserModel.find();
        // Match the user ID ensuring we have proper type safety using type assertion
        // We know that UserModel documents from Mongoose have _id properties
        const matchingUser = users.find((u: any) => {
          if (u && u._id) {
            return u._id.toString().startsWith(idString);
          }
          return false;
        });
        
        // Use explicit type assertion, since we know what the structure looks like
        if (matchingUser) {
          // The matchingUser is from UserModel so we know it has _id
          const matchingUserId = (matchingUser as any)._id;
          const investments = await InvestmentModel.find({ investorId: matchingUserId.toString() }).sort({ createdAt: -1 });
          return investments.map(documentToInvestment);
        }
        return [];
      }
    } catch (error) {
      log(`Error getting user investments: ${error instanceof Error ? error.message : String(error)}`, 'mongodb');
      return [];
    }
  }

  async getStartupInvestments(startupId: number | string): Promise<Investment[]> {
    try {
      const idString = startupId.toString();
      
      // If this looks like a valid ObjectID, try to find investments directly
      if (idString.length === 24) {
        const investments = await InvestmentModel.find({ startupId: idString }).sort({ createdAt: -1 });
        return investments.map(documentToInvestment);
      } else {
        // If it's a partial ID, try to find the startup first
        const matchingStartup = await this.getStartup(idString);
        if (matchingStartup) {
          const investments = await InvestmentModel.find({ startupId: matchingStartup.id }).sort({ createdAt: -1 });
          return investments.map(documentToInvestment);
        }
        return [];
      }
    } catch (error) {
      log(`Error getting startup investments: ${error instanceof Error ? error.message : String(error)}`, 'mongodb');
      return [];
    }
  }

  async createInvestment(insertInvestment: InsertInvestment): Promise<Investment> {
    try {
      const newInvestment = new InvestmentModel(insertInvestment);
      const savedInvestment = await newInvestment.save();
      return documentToInvestment(savedInvestment);
    } catch (error) {
      log(`Error creating investment: ${error instanceof Error ? error.message : String(error)}`, 'mongodb');
      throw error;
    }
  }

  // Update methods
  async getUpdates(): Promise<Update[]> {
    try {
      const updates = await UpdateModel.find().sort({ createdAt: -1 });
      return updates.map(documentToUpdate);
    } catch (error) {
      log(`Error getting updates: ${error instanceof Error ? error.message : String(error)}`, 'mongodb');
      return [];
    }
  }

  async getUpdate(id: number | string): Promise<Update | undefined> {
    try {
      const update = await UpdateModel.findById(id);
      return update ? documentToUpdate(update) : undefined;
    } catch (error) {
      log(`Error getting update by ID: ${error instanceof Error ? error.message : String(error)}`, 'mongodb');
      return undefined;
    }
  }

  async getStartupUpdates(startupId: number | string): Promise<Update[]> {
    try {
      const idString = startupId.toString();
      
      // If this looks like a valid ObjectID, try to find updates directly
      if (idString.length === 24) {
        const updates = await UpdateModel.find({ startupId: idString }).sort({ createdAt: -1 });
        return updates.map(documentToUpdate);
      } else {
        // If it's a partial ID, try to find the startup first
        const matchingStartup = await this.getStartup(idString);
        if (matchingStartup) {
          const updates = await UpdateModel.find({ startupId: matchingStartup.id }).sort({ createdAt: -1 });
          return updates.map(documentToUpdate);
        }
        return [];
      }
    } catch (error) {
      log(`Error getting startup updates: ${error instanceof Error ? error.message : String(error)}`, 'mongodb');
      return [];
    }
  }

  async createUpdate(insertUpdate: InsertUpdate): Promise<Update> {
    try {
      const newUpdate = new UpdateModel(insertUpdate);
      const savedUpdate = await newUpdate.save();
      return documentToUpdate(savedUpdate);
    } catch (error) {
      log(`Error creating update: ${error instanceof Error ? error.message : String(error)}`, 'mongodb');
      throw error;
    }
  }

  // Milestone methods
  async getMilestones(): Promise<Milestone[]> {
    try {
      const milestones = await MilestoneModel.find().sort({ targetDate: 1 });
      return milestones.map(documentToMilestone);
    } catch (error) {
      log(`Error getting milestones: ${error instanceof Error ? error.message : String(error)}`, 'mongodb');
      return [];
    }
  }

  async getMilestone(id: number | string): Promise<Milestone | undefined> {
    try {
      const milestone = await MilestoneModel.findById(id);
      return milestone ? documentToMilestone(milestone) : undefined;
    } catch (error) {
      log(`Error getting milestone by ID: ${error instanceof Error ? error.message : String(error)}`, 'mongodb');
      return undefined;
    }
  }

  async getStartupMilestones(startupId: number | string): Promise<Milestone[]> {
    try {
      const idString = startupId.toString();
      
      // If this looks like a valid ObjectID, try to find milestones directly
      if (idString.length === 24) {
        const milestones = await MilestoneModel.find({ startupId: idString }).sort({ targetDate: 1 });
        return milestones.map(documentToMilestone);
      } else {
        // If it's a partial ID, try to find the startup first
        const matchingStartup = await this.getStartup(idString);
        if (matchingStartup) {
          const milestones = await MilestoneModel.find({ startupId: matchingStartup.id }).sort({ targetDate: 1 });
          return milestones.map(documentToMilestone);
        }
        return [];
      }
    } catch (error) {
      log(`Error getting startup milestones: ${error instanceof Error ? error.message : String(error)}`, 'mongodb');
      return [];
    }
  }

  async createMilestone(insertMilestone: InsertMilestone): Promise<Milestone> {
    try {
      const newMilestone = new MilestoneModel({
        ...insertMilestone,
        completed: false
      });
      const savedMilestone = await newMilestone.save();
      return documentToMilestone(savedMilestone);
    } catch (error) {
      log(`Error creating milestone: ${error instanceof Error ? error.message : String(error)}`, 'mongodb');
      throw error;
    }
  }

  async updateMilestoneStatus(id: number | string, completed: boolean): Promise<Milestone> {
    try {
      const milestone = await MilestoneModel.findByIdAndUpdate(
        id,
        { completed },
        { new: true }
      );
      
      if (!milestone) {
        throw new Error("Milestone not found");
      }
      
      return documentToMilestone(milestone);
    } catch (error) {
      log(`Error updating milestone status: ${error instanceof Error ? error.message : String(error)}`, 'mongodb');
      throw error;
    }
  }
}