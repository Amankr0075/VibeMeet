import mongoose, { Schema, Document } from 'mongoose';

export interface IMatchSession extends Document {
  user: mongoose.Types.ObjectId;
  socketId: string;
  status: 'QUEUED' | 'MATCHED';
  joinedAt: Date;
}

const MatchSessionSchema: Schema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  socketId: { type: String, required: true },
  status: { type: String, enum: ['QUEUED', 'MATCHED'], default: 'QUEUED' },
  joinedAt: { type: Date, default: Date.now }
});

export default mongoose.model<IMatchSession>('MatchSession', MatchSessionSchema);
