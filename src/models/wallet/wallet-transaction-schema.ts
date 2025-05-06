import mongoose, { Schema } from "mongoose";

const walletTransactionSchema = new mongoose.Schema(
  {
    walletId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "wallets",
      required: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true
    },
    amount: {
      type: Number,
      required: true
    },
    type: {
      type: String,
      enum: ["CREDIT", "DEBIT"],
      required: true
    },
    status: {
      type: String,
      enum: ["PENDING", "COMPLETED", "FAILED"],
      default: "PENDING"
    },
    description: {
      type: String
    },
    reference: {
      type: String
    },
    paymentMethod: {
      type: String
    },
    transactionId: {
      type: String
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "orders"
    },
    metadata: {
      type: Object
    }
  },
  { timestamps: true }
);

export const walletTransactionModel = mongoose.model("wallet_transactions", walletTransactionSchema);
