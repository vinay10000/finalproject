import { pgTable, text, serial, integer, boolean, timestamp, doublePrecision, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User schema for both investors and startups
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  walletAddress: text("wallet_address").unique(),
  userType: text("user_type").notNull(), // 'investor' or 'startup'
  createdAt: timestamp("created_at").defaultNow(),
});

// Startup profile schema
export const startups = pgTable("startups", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  fundingStage: text("funding_stage").notNull(),
  location: text("location"),
  fundingGoal: doublePrecision("funding_goal").notNull(),
  currentFunding: doublePrecision("current_funding").default(0),
  logoUrl: text("logo_url"),
  pitchDeckUrl: text("pitch_deck_url"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Investments schema
export const investments = pgTable("investments", {
  id: serial("id").primaryKey(),
  investorId: integer("investor_id").notNull(),
  startupId: integer("startup_id").notNull(),
  amount: doublePrecision("amount").notNull(),
  transactionHash: text("transaction_hash").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Updates from startups to their investors
export const updates = pgTable("updates", {
  id: serial("id").primaryKey(),
  startupId: integer("startup_id").notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Milestones for startups
export const milestones = pgTable("milestones", {
  id: serial("id").primaryKey(),
  startupId: integer("startup_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  targetDate: timestamp("target_date"),
  completed: boolean("completed").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Schema for inserting users
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  walletAddress: true,
  userType: true,
}).extend({
  password: z.string().min(6, "Password must be at least 6 characters long"),
  email: z.string().email("Please enter a valid email address"),
  userType: z.enum(["investor", "startup"], {
    errorMap: () => ({ message: "User type must be either 'investor' or 'startup'" })
  }),
  walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Please enter a valid Ethereum wallet address").optional()
});

// Schema for inserting startups
export const insertStartupSchema = createInsertSchema(startups).pick({
  userId: true,
  name: true,
  description: true,
  category: true,
  fundingStage: true,
  location: true,
  fundingGoal: true,
  logoUrl: true,
  pitchDeckUrl: true,
});

// Schema for inserting investments
export const insertInvestmentSchema = createInsertSchema(investments).pick({
  investorId: true,
  startupId: true,
  amount: true,
  transactionHash: true,
});

// Schema for inserting updates
export const insertUpdateSchema = createInsertSchema(updates).pick({
  startupId: true,
  title: true,
  content: true,
});

// Schema for inserting milestones
export const insertMilestoneSchema = createInsertSchema(milestones).pick({
  startupId: true,
  title: true,
  description: true,
  targetDate: true,
});

// Export types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertStartup = z.infer<typeof insertStartupSchema>;
export type Startup = typeof startups.$inferSelect;
export type InsertInvestment = z.infer<typeof insertInvestmentSchema>;
export type Investment = typeof investments.$inferSelect;
export type InsertUpdate = z.infer<typeof insertUpdateSchema>;
export type Update = typeof updates.$inferSelect;
export type InsertMilestone = z.infer<typeof insertMilestoneSchema>;
export type Milestone = typeof milestones.$inferSelect;
