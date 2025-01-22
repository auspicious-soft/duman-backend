import mongoose, { Schema } from "mongoose";

const collectionsSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      requried: true,
    },
    image: {
      type: String,
      requried: true,
    },
    books: {
      type: [Schema.Types.ObjectId],
      ref: 'books'
    }
  },
  { timestamps: true }
);

export const collectionsModel = mongoose.model("collections", collectionsSchema);
