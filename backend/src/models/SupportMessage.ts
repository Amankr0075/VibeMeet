import mongoose, { Schema, Document } from 'mongoose';

export interface IEmailReply {
  senderEmail: string;
  senderName: string;
  message: string;
  sentAt: Date;
}

export interface ISupportMessage extends Document {
  name: string;
  email: string;
  subject: string;
  message: string;
  category?: 'GENERAL' | 'SAFETY' | 'TECHNICAL' | 'LEGAL' | 'PARTNERSHIP';
  status: 'PENDING' | 'REPLIED' | 'CLOSED';
  replies: IEmailReply[];
  createdAt: Date;
  updatedAt: Date;
}

const SupportMessageSchema = new Schema({
  name: { type: String, required: true, trim: true, maxlength: 100 },
  email: { type: String, required: true, trim: true, lowercase: true },
  subject: { type: String, required: true, trim: true, maxlength: 200 },
  message: { type: String, required: true, trim: true, maxlength: 5000 },
  category: { 
    type: String, 
    enum: ['GENERAL', 'SAFETY', 'TECHNICAL', 'LEGAL', 'PARTNERSHIP'], 
    default: 'GENERAL' 
  },
  status: { 
    type: String, 
    enum: ['PENDING', 'REPLIED', 'CLOSED'], 
    default: 'PENDING' 
  },
  replies: [{
    senderEmail: { type: String, required: true },
    senderName: { type: String, default: 'VibeMeet Support' },
    message: { type: String, required: true },
    sentAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

SupportMessageSchema.index({ email: 1, createdAt: -1 });

export default mongoose.model<ISupportMessage>('SupportMessage', SupportMessageSchema);
