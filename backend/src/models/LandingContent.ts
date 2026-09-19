import mongoose, { Schema, Document } from 'mongoose';

export interface ILandingContent extends Document {
  announcement: string;
  occasion: { title: string; description: string; badge: string; active: boolean; imageUrl?: string; expiresAt?: Date };
  offer: { title: string; description: string; ctaLabel: string; active: boolean; imageUrl?: string; expiresAt?: Date };
  collaboration: { title: string; description: string; partner: string; active: boolean; imageUrl?: string; expiresAt?: Date };
  updatedBy?: mongoose.Types.ObjectId;
}

const LandingContentSchema = new Schema<ILandingContent>({
  announcement: { type: String, default: 'New connections are happening now — your next great conversation could start today.' },
  occasion: { title: { type: String, default: 'Tonight on VibeMeet' }, description: { type: String, default: 'Meet people who are ready for a real conversation.' }, badge: { type: String, default: 'LIVE EVENT' }, active: { type: Boolean, default: true }, imageUrl: { type: String, maxlength: 4_500_000 }, expiresAt: { type: Date } },
  offer: { title: { type: String, default: 'Your first vibe is on us' }, description: { type: String, default: 'Join free and discover a more human way to meet.' }, ctaLabel: { type: String, default: 'Join free' }, active: { type: Boolean, default: true }, imageUrl: { type: String, maxlength: 4_500_000 }, expiresAt: { type: Date } },
  collaboration: { title: { type: String, default: 'Made for meaningful moments' }, description: { type: String, default: 'A safer, warmer place to meet beyond the scroll.' }, partner: { type: String, default: 'VibeMeet community' }, active: { type: Boolean, default: true }, imageUrl: { type: String, maxlength: 4_500_000 }, expiresAt: { type: Date } },
  updatedBy: { type: Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

export default mongoose.model<ILandingContent>('LandingContent', LandingContentSchema);
