import { type User, type InsertUser, type Startup, type InsertStartup, type Investment, type InsertInvestment, type Update, type InsertUpdate, type Milestone, type InsertMilestone } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";
import { log } from "./vite";

const MemoryStore = createMemoryStore(session);

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Startup methods
  getStartups(): Promise<Startup[]>;
  getStartup(id: number | string): Promise<Startup | undefined>;
  getStartupByUserId(userId: number): Promise<Startup | undefined>;
  createStartup(startup: InsertStartup): Promise<Startup>;
  updateStartupFunding(startupId: number | string, amount: number): Promise<Startup>;
  
  // Investment methods
  getInvestments(): Promise<Investment[]>;
  getInvestment(id: number | string): Promise<Investment | undefined>;
  getUserInvestments(userId: number): Promise<Investment[]>;
  getStartupInvestments(startupId: number): Promise<Investment[]>;
  createInvestment(investment: InsertInvestment): Promise<Investment>;
  
  // Update methods
  getUpdates(): Promise<Update[]>;
  getUpdate(id: number): Promise<Update | undefined>;
  getStartupUpdates(startupId: number): Promise<Update[]>;
  createUpdate(update: InsertUpdate): Promise<Update>;
  
  // Milestone methods
  getMilestones(): Promise<Milestone[]>;
  getMilestone(id: number): Promise<Milestone | undefined>;
  getStartupMilestones(startupId: number): Promise<Milestone[]>;
  createMilestone(milestone: InsertMilestone): Promise<Milestone>;
  updateMilestoneStatus(id: number, completed: boolean): Promise<Milestone>;
  
  // Session store
  sessionStore: session.Store;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private startups: Map<number, Startup>;
  private investments: Map<number, Investment>;
  private updates: Map<number, Update>;
  private milestones: Map<number, Milestone>;
  sessionStore: session.Store;
  
  private userIdCounter: number;
  private startupIdCounter: number;
  private investmentIdCounter: number;
  private updateIdCounter: number;
  private milestoneIdCounter: number;

  constructor() {
    this.users = new Map();
    this.startups = new Map();
    this.investments = new Map();
    this.updates = new Map();
    this.milestones = new Map();
    
    this.userIdCounter = 1;
    this.startupIdCounter = 1;
    this.investmentIdCounter = 1;
    this.updateIdCounter = 1;
    this.milestoneIdCounter = 1;
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // Clear expired sessions every 24h
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const createdAt = new Date();
    const user: User = { 
      ...insertUser, 
      id, 
      createdAt,
      walletAddress: insertUser.walletAddress || null
    };
    this.users.set(id, user);
    return user;
  }
  
  // Startup methods
  async getStartups(): Promise<Startup[]> {
    return Array.from(this.startups.values());
  }
  
  async getStartup(id: number | string): Promise<Startup | undefined> {
    // For MemStorage, convert string id to number if needed
    const numericId = typeof id === 'string' ? parseInt(id) : id;
    return this.startups.get(numericId);
  }
  
  async getStartupByUserId(userId: number): Promise<Startup | undefined> {
    return Array.from(this.startups.values()).find(
      (startup) => startup.userId === userId
    );
  }
  
  async createStartup(insertStartup: InsertStartup): Promise<Startup> {
    const id = this.startupIdCounter++;
    const createdAt = new Date();
    const startup: Startup = { 
      ...insertStartup, 
      id, 
      createdAt, 
      currentFunding: 0,
      location: insertStartup.location || null,
      logoUrl: insertStartup.logoUrl || null,
      pitchDeckUrl: insertStartup.pitchDeckUrl || null
    };
    this.startups.set(id, startup);
    return startup;
  }
  
  async updateStartupFunding(startupId: number | string, amount: number): Promise<Startup> {
    // Convert string id to number if needed for MemStorage
    const numericId = typeof startupId === 'string' ? parseInt(startupId) : startupId;
    
    const startup = await this.getStartup(numericId);
    if (!startup) {
      throw new Error("Startup not found");
    }
    
    const currentFunding = startup.currentFunding || 0;
    
    const updatedStartup: Startup = {
      ...startup,
      currentFunding: currentFunding + amount
    };
    
    this.startups.set(numericId, updatedStartup);
    return updatedStartup;
  }
  
  // Investment methods
  async getInvestments(): Promise<Investment[]> {
    return Array.from(this.investments.values());
  }
  
  async getInvestment(id: number | string): Promise<Investment | undefined> {
    // For MemStorage, convert string id to number if needed
    const numericId = typeof id === 'string' ? parseInt(id) : id;
    return this.investments.get(numericId);
  }
  
  async getUserInvestments(userId: number): Promise<Investment[]> {
    return Array.from(this.investments.values())
      .filter(investment => investment.investorId === userId);
  }
  
  async getStartupInvestments(startupId: number): Promise<Investment[]> {
    return Array.from(this.investments.values())
      .filter(investment => investment.startupId === startupId);
  }
  
  async createInvestment(insertInvestment: InsertInvestment): Promise<Investment> {
    const id = this.investmentIdCounter++;
    const createdAt = new Date();
    const investment: Investment = { ...insertInvestment, id, createdAt };
    this.investments.set(id, investment);
    return investment;
  }
  
  // Update methods
  async getUpdates(): Promise<Update[]> {
    return Array.from(this.updates.values());
  }
  
  async getUpdate(id: number): Promise<Update | undefined> {
    return this.updates.get(id);
  }
  
  async getStartupUpdates(startupId: number): Promise<Update[]> {
    return Array.from(this.updates.values())
      .filter(update => update.startupId === startupId);
  }
  
  async createUpdate(insertUpdate: InsertUpdate): Promise<Update> {
    const id = this.updateIdCounter++;
    const createdAt = new Date();
    const update: Update = { ...insertUpdate, id, createdAt };
    this.updates.set(id, update);
    return update;
  }
  
  // Milestone methods
  async getMilestones(): Promise<Milestone[]> {
    return Array.from(this.milestones.values());
  }
  
  async getMilestone(id: number): Promise<Milestone | undefined> {
    return this.milestones.get(id);
  }
  
  async getStartupMilestones(startupId: number): Promise<Milestone[]> {
    return Array.from(this.milestones.values())
      .filter(milestone => milestone.startupId === startupId);
  }
  
  async createMilestone(insertMilestone: InsertMilestone): Promise<Milestone> {
    const id = this.milestoneIdCounter++;
    const createdAt = new Date();
    const milestone: Milestone = { 
      ...insertMilestone, 
      id, 
      createdAt, 
      completed: false,
      description: insertMilestone.description || null,
      targetDate: insertMilestone.targetDate || null
    };
    this.milestones.set(id, milestone);
    return milestone;
  }
  
  async updateMilestoneStatus(id: number, completed: boolean): Promise<Milestone> {
    const milestone = await this.getMilestone(id);
    if (!milestone) {
      throw new Error("Milestone not found");
    }
    
    const updatedMilestone: Milestone = {
      ...milestone,
      completed
    };
    
    this.milestones.set(id, updatedMilestone);
    return updatedMilestone;
  }
}

// Import our MongoDB storage implementation
import { MongoDBStorage } from './db/mongodb-storage';

// Determine which storage implementation to use
let storageImplementation: IStorage;

// Check if we have a MongoDB URI configuration and prioritize it
if (process.env.MONGODB_URI) {
  log('Using MongoDB storage implementation', 'storage');
  storageImplementation = new MongoDBStorage();
} else {
  log('Using in-memory storage implementation', 'storage');
  storageImplementation = new MemStorage();
}

export const storage = storageImplementation;
