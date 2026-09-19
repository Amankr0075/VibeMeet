import mongoose, { Schema, Document } from 'mongoose';

export interface IChatMessage {
  senderId: mongoose.Types.ObjectId;
  message: string;
  timestamp: Date;
}

export interface ICallSession extends Document {
  userA: mongoose.Types.ObjectId;
  userB: mongoose.Types.ObjectId;
  startedAt: Date;
  endedAt?: Date;
  duration?: number; // in seconds
  status: 'ACTIVE' | 'ENDED' | 'REPORTED' | 'AI_TERMINATED';
  aiSafetyStatus: 'SAFE' | 'WARNING' | 'DANGER';
  chatMessages: IChatMessage[];
}

const ChatMessageSchema = new Schema<IChatMessage>({
  senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  message: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
}, { _id: false });

const CallSessionSchema: Schema = new Schema({
  userA: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  userB: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  startedAt: { type: Date, default: Date.now },
  endedAt: { type: Date },
  duration: { type: Number },
  status: { type: String, enum: ['ACTIVE', 'ENDED', 'REPORTED', 'AI_TERMINATED'], default: 'ACTIVE' },
  aiSafetyStatus: { type: String, enum: ['SAFE', 'WARNING', 'DANGER'], default: 'SAFE' },
  chatMessages: { type: [ChatMessageSchema], default: [] }
}, { timestamps: true });

export default mongoose.model<ICallSession>('CallSession', CallSessionSchema);
