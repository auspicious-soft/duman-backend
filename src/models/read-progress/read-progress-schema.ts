import mongoose from "mongoose";

const readProgressSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },
    bookId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "products",
      required: true,
    },
    progress: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

export const readProgressModel = mongoose.model("readProgress", readProgressSchema);
