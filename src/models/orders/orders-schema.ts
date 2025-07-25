import mongoose, { Schema } from "mongoose";

const ordersSchema = new mongoose.Schema(
  {
    identifier:{
      type:String
    },
    productIds: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "products",
    },
    voucherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'discountVouchers'
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
    },
    totalAmount: {
      type: Number,
      required: true
    },
    paymentMethod: {
      type: String,
    },
    transactionId: {
      type: String,
    },
    status:{
      type: String,
      enum:['Pending','Completed','Failed'],
      default: 'Pending'
    },
    // Enhanced payment tracking fields
    paymentCompletedAt: {
      type: Date,
    },
    paymentAmount: {
      type: Number,
    },
    paymentGatewayResponse: {
      type: mongoose.Schema.Types.Mixed,
    },
    redeemPoints:{
      type: String
    }
  },
  { timestamps: true }
);

export const ordersModel = mongoose.model("orders", ordersSchema);
