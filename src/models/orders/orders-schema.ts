import mongoose, { Schema } from "mongoose";

const ordersSchema = new mongoose.Schema(
  {
    categoryId: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "categories",
        // requried: true,
      },
    ],
    productId: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "products",
      },
    ],
    couponId: {
      type: String,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
    },
    totalAmount: {
      type: String,
    },
  },
  { timestamps: true }
);

export const ordersModel = mongoose.model("orders", ordersSchema);
