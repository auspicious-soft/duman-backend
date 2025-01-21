import mongoose, { Schema } from "mongoose";

const publishersSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      requried: true,
    },
    categoryId: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "categories",
      // requried: true,
    },
    email: {
      type: String,
    },
    description: {
      type: String,
    },
    country: {
      type: String,
    },

    image: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

export const publishersModel = mongoose.model("publishers", publishersSchema);
