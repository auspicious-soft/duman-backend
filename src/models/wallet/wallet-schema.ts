import mongoose, { Schema } from "mongoose";

const walletSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
      unique: true
    },
    balance: {
      type: Number,
      default: 0,
      min: 0
    },
    currency: {
      type: String,
      default: "KZT"
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

// Create a compound index on userId and currency
walletSchema.index({ userId: 1, currency: 1 }, { unique: true });

export const walletModel = mongoose.model("wallets", walletSchema);
