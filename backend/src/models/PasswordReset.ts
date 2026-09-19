import mongoose, { Schema, Document } from 'mongoose';

export interface IPasswordReset extends Document {
  email: string;
  otpHash: string;
  otpExpiresAt: Date;
  otpAttempts: number;
}

const PasswordResetSchema = new Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  otpHash: { type: String, required: true },
  otpExpiresAt: { type: Date, required: true },
  otpAttempts: { type: Number, default: 0 },
}, { timestamps: true });

// Document automatically expires after 1 hour in MongoDB
PasswordResetSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 });

export default mongoose.model<IPasswordReset>('PasswordReset', PasswordResetSchema);
