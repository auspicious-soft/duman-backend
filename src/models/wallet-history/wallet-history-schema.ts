import mongoose from "mongoose";

const walletHistorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "products",
      // type: String,
      required: false,
    },
    points: {
      type: String,
    },
    type:{
      type: String,
      enum: ["earn","redeem"]
    }
    
  },
  { timestamps: true }
);

export const walletHistoryModel = mongoose.model("wallet_history", walletHistorySchema);
