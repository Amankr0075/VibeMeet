import mongoose, { Schema, Document } from 'mongoose';

export interface IPendingRegistration extends Document {
  name: string;
  email: string;
  passwordHash: string;
  otpHash: string;
  otpExpiresAt: Date;
  otpAttempts: number;
  isCollegeStudent: boolean;
  institutionName?: string;
}

const PendingRegistrationSchema = new Schema({
  name: { type: String, required: true, trim: true, maxlength: 80 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  otpHash: { type: String, required: true },
  otpExpiresAt: { type: Date, required: true },
  otpAttempts: { type: Number, default: 0 },
  isCollegeStudent: { type: Boolean, default: false },
  institutionName: { type: String, trim: true, maxlength: 160 },
}, { timestamps: true });

PendingRegistrationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 });

export default mongoose.model<IPendingRegistration>('PendingRegistration', PendingRegistrationSchema);
