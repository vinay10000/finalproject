import mongoose, { Document, Schema } from 'mongoose';
import { InsertUser, User, InsertStartup, Startup, InsertInvestment, Investment, InsertUpdate, Update, InsertMilestone, Milestone } from '@shared/schema';

// User Model
export interface UserDocument extends Document, Omit<User, 'id'> {
  // The MongoDB _id will replace the id field
}

const userSchema = new Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  walletAddress: { type: String, sparse: true, unique: true },
  walletConfirmed: { type: Boolean, default: false },
  userType: { type: String, required: true, enum: ['investor', 'startup'] },
  createdAt: { type: Date, default: Date.now }
});

// Startup Model
export interface StartupDocument extends Document, Omit<Startup, 'id' | 'userId' | 'createdAt'> {
  userId: mongoose.Types.ObjectId;
  createdAt: Date;
}

const startupSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, required: true },
  fundingStage: { type: String, required: true },
  location: { type: String },
  fundingGoal: { type: Number, required: true },
  currentFunding: { type: Number, default: 0 },
  logoUrl: { type: String },
  pitchDeckUrl: { type: String },
  photoUrl: { type: String },
  videoUrl: { type: String },
  createdAt: { type: Date, default: Date.now }
});

// Investment Model
export interface InvestmentDocument extends Document, Omit<Investment, 'id' | 'investorId' | 'startupId' | 'createdAt'> {
  investorId: mongoose.Types.ObjectId;
  startupId: mongoose.Types.ObjectId;
  createdAt: Date;
}

const investmentSchema = new Schema({
  investorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  startupId: { type: Schema.Types.ObjectId, ref: 'Startup', required: true },
  amount: { type: Number, required: true },
  transactionHash: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

// Update Model
export interface UpdateDocument extends Document, Omit<Update, 'id' | 'startupId' | 'createdAt'> {
  startupId: mongoose.Types.ObjectId;
  createdAt: Date;
}

const updateSchema = new Schema({
  startupId: { type: Schema.Types.ObjectId, ref: 'Startup', required: true },
  title: { type: String, required: true },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

// Milestone Model
export interface MilestoneDocument extends Document, Omit<Milestone, 'id' | 'startupId' | 'createdAt'> {
  startupId: mongoose.Types.ObjectId;
  createdAt: Date;
}

const milestoneSchema = new Schema({
  startupId: { type: Schema.Types.ObjectId, ref: 'Startup', required: true },
  title: { type: String, required: true },
  description: { type: String },
  targetDate: { type: Date },
  completed: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

// Create and export models
export const UserModel = mongoose.model<UserDocument>('User', userSchema);
export const StartupModel = mongoose.model<StartupDocument>('Startup', startupSchema);
export const InvestmentModel = mongoose.model<InvestmentDocument>('Investment', investmentSchema);
export const UpdateModel = mongoose.model<UpdateDocument>('Update', updateSchema);
export const MilestoneModel = mongoose.model<MilestoneDocument>('Milestone', milestoneSchema);

// Helper functions to convert between MongoDB documents and our application types
export function documentToUser(doc: UserDocument): User {
  const { _id, ...rest } = doc.toObject();
  return {
    id: _id.toString(),
    ...rest
  } as User;
}

export function documentToStartup(doc: StartupDocument): Startup {
  const { _id, userId, ...rest } = doc.toObject();
  return {
    id: _id.toString(),
    userId: typeof userId === 'object' ? userId.toString() : userId,
    ...rest
  } as Startup;
}

export function documentToInvestment(doc: InvestmentDocument): Investment {
  const { _id, investorId, startupId, ...rest } = doc.toObject();
  return {
    id: _id.toString(),
    investorId: typeof investorId === 'object' ? investorId.toString() : investorId,
    startupId: typeof startupId === 'object' ? startupId.toString() : startupId,
    ...rest
  } as Investment;
}

export function documentToUpdate(doc: UpdateDocument): Update {
  const { _id, startupId, ...rest } = doc.toObject();
  return {
    id: _id.toString(),
    startupId: typeof startupId === 'object' ? startupId.toString() : startupId,
    ...rest
  } as Update;
}

export function documentToMilestone(doc: MilestoneDocument): Milestone {
  const { _id, startupId, ...rest } = doc.toObject();
  return {
    id: _id.toString(),
    startupId: typeof startupId === 'object' ? startupId.toString() : startupId,
    ...rest
  } as Milestone;
}