import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  name: string;
  passwordHash: string;
  username?: string;
  email: string;
  profileImage?: string;
  gender?: 'Male' | 'Female' | 'Other' | 'Prefer not to say';
  preferredGender?: 'Men' | 'Women' | 'Everyone';
  isCollegeStudent: boolean;
  institutionName?: string;
  preferredCommunity?: 'EVERYONE' | 'COLLEGE_STUDENTS';
  role: 'USER' | 'ADMIN';
  bio?: string;
  location?: string; // New field for admin to view location
  accountStatus: 'ACTIVE' | 'SUSPENDED' | 'AI_BLOCKED' | 'BANNED';
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt: Date;
  lastActiveAt: Date;
  loginAttempts: number;
  lockoutUntil?: Date;
  loginOtpHash?: string;
  loginOtpExpiresAt?: Date;
}

const UserSchema: Schema = new Schema({
  name: { type: String, required: true },
  passwordHash: { type: String, required: true, select: false },
  username: { type: String, unique: true, sparse: true },
  email: { type: String, required: true, unique: true },
  profileImage: { type: String },
  bio: { type: String, default: '' },
  gender: { type: String, enum: ['Male', 'Female', 'Other', 'Prefer not to say'] },
  preferredGender: { type: String, enum: ['Men', 'Women', 'Everyone'] },
  isCollegeStudent: { type: Boolean, default: false },
  institutionName: { type: String, trim: true, maxlength: 160 },
  preferredCommunity: { type: String, enum: ['EVERYONE', 'COLLEGE_STUDENTS'], default: 'EVERYONE' },
  role: { type: String, enum: ['USER', 'ADMIN'], default: 'USER' },
  accountStatus: { type: String, enum: ['ACTIVE', 'SUSPENDED', 'AI_BLOCKED', 'BANNED'], default: 'ACTIVE' },
  location: { type: String }, // New field
  lastLoginAt: { type: Date, default: Date.now },
  lastActiveAt: { type: Date, default: Date.now },
  loginAttempts: { type: Number, default: 0 },
  lockoutUntil: { type: Date },
  loginOtpHash: { type: String, select: false },
  loginOtpExpiresAt: { type: Date }
}, { timestamps: true });

export default mongoose.model<IUser>('User', UserSchema);
