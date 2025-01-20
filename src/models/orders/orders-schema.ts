import mongoose, { Schema } from "mongoose";

const ordersSchema = new mongoose.Schema(
  {
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
  },
  { timestamps: true }
);

export const ordersModel = mongoose.model("orders", ordersSchema);
