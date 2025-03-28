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
    this.sessionStore = MongoStore.create({
      clientPromise: getMongoDBConnection().then(mongoose => mongoose.connection.getClient()),
      ttl: 14 * 24 * 60 * 60, // 14 days in seconds
      autoRemove: 'native'
    });
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
      const newUser = new UserModel(insertUser);
      const savedUser = await newUser.save();
      return documentToUser(savedUser);
    } catch (error) {
      log(`Error creating user: ${error instanceof Error ? error.message : String(error)}`, 'mongodb');
      throw error;
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
      // Convert numeric id to string if needed
      const idString = id.toString();
      const startup = await StartupModel.findById(idString);
      return startup ? documentToStartup(startup) : undefined;
    } catch (error) {
      log(`Error getting startup by ID: ${error instanceof Error ? error.message : String(error)}`, 'mongodb');
      return undefined;
    }
  }

  async getStartupByUserId(userId: number): Promise<Startup | undefined> {
    try {
      const startup = await StartupModel.findOne({ userId: String(userId) });
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
        currentFunding: 0
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
      // Convert numeric id to string if needed
      const idString = startupId.toString();
      
      const startup = await StartupModel.findByIdAndUpdate(
        idString,
        { $inc: { currentFunding: amount } },
        { new: true }
      );
      
      if (!startup) {
        throw new Error("Startup not found");
      }
      
      return documentToStartup(startup);
    } catch (error) {
      log(`Error updating startup funding: ${error instanceof Error ? error.message : String(error)}`, 'mongodb');
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
      // Convert numeric id to string if needed
      const idString = id.toString();
      const investment = await InvestmentModel.findById(idString);
      return investment ? documentToInvestment(investment) : undefined;
    } catch (error) {
      log(`Error getting investment by ID: ${error instanceof Error ? error.message : String(error)}`, 'mongodb');
      return undefined;
    }
  }

  async getUserInvestments(userId: number): Promise<Investment[]> {
    try {
      const investments = await InvestmentModel.find({ investorId: String(userId) }).sort({ createdAt: -1 });
      return investments.map(documentToInvestment);
    } catch (error) {
      log(`Error getting user investments: ${error instanceof Error ? error.message : String(error)}`, 'mongodb');
      return [];
    }
  }

  async getStartupInvestments(startupId: number): Promise<Investment[]> {
    try {
      const investments = await InvestmentModel.find({ startupId: String(startupId) }).sort({ createdAt: -1 });
      return investments.map(documentToInvestment);
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

  async getUpdate(id: number): Promise<Update | undefined> {
    try {
      const update = await UpdateModel.findById(id);
      return update ? documentToUpdate(update) : undefined;
    } catch (error) {
      log(`Error getting update by ID: ${error instanceof Error ? error.message : String(error)}`, 'mongodb');
      return undefined;
    }
  }

  async getStartupUpdates(startupId: number): Promise<Update[]> {
    try {
      const updates = await UpdateModel.find({ startupId: String(startupId) }).sort({ createdAt: -1 });
      return updates.map(documentToUpdate);
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

  async getMilestone(id: number): Promise<Milestone | undefined> {
    try {
      const milestone = await MilestoneModel.findById(id);
      return milestone ? documentToMilestone(milestone) : undefined;
    } catch (error) {
      log(`Error getting milestone by ID: ${error instanceof Error ? error.message : String(error)}`, 'mongodb');
      return undefined;
    }
  }

  async getStartupMilestones(startupId: number): Promise<Milestone[]> {
    try {
      const milestones = await MilestoneModel.find({ startupId: String(startupId) }).sort({ targetDate: 1 });
      return milestones.map(documentToMilestone);
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

  async updateMilestoneStatus(id: number, completed: boolean): Promise<Milestone> {
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