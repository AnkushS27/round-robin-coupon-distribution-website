import mongoose, { Schema, Document } from 'mongoose';

// Define the interface for the Coupon document
export interface ICoupon extends Document {
  code: string;
  isClaimed: boolean;
  claimedBy?: string; // IP address of the claimant
  claimedAt?: Date;   // Timestamp of when it was claimed
}

// Define the Mongoose schema
const CouponSchema: Schema = new Schema({
  code: { type: String, required: true, unique: true },
  isClaimed: { type: Boolean, default: false },
  claimedBy: { type: String, required: false },
  claimedAt: { type: Date, required: false },
});

// Export the model (only create it if it doesn't already exist)
export default mongoose.models.Coupon || mongoose.model<ICoupon>('Coupon', CouponSchema);