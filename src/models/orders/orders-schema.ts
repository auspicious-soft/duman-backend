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
    discountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'discounts'
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
  },
  { timestamps: true }
);

export const ordersModel = mongoose.model("orders", ordersSchema);
