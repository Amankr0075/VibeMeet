import mongoose, { Schema, Document } from 'mongoose';

export interface IModerationIncident extends Document {
  userId: mongoose.Types.ObjectId;
  callSessionId: mongoose.Types.ObjectId;
  source: 'TEXT_CHAT' | 'VIDEO_SAFETY' | 'USER_REPORT' | 'BEHAVIOR_ANALYSIS';
  categories: string[];
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  confidenceScore: number;
  recommendedAction: string;
  finalAction: string;
  policyVersion?: string;
  status: 'PENDING' | 'REVIEWED' | 'DISMISSED';
  createdAt: Date;
  reviewedBy?: mongoose.Types.ObjectId;
  reviewedAt?: Date;
}

const ModerationIncidentSchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  callSessionId: { type: Schema.Types.ObjectId, ref: 'CallSession', required: true },
  source: { type: String, required: true },
  categories: [{ type: String }],
  riskLevel: { type: String, required: true },
  confidenceScore: { type: Number, required: true },
  recommendedAction: { type: String, required: true },
  finalAction: { type: String, required: true },
  policyVersion: { type: String },
  status: { type: String, enum: ['PENDING', 'REVIEWED', 'DISMISSED'], default: 'PENDING' },
  reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  reviewedAt: { type: Date }
}, { timestamps: true });

export default mongoose.model<IModerationIncident>('ModerationIncident', ModerationIncidentSchema);
