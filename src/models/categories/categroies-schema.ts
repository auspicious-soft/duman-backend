import mongoose from "mongoose";

const categoriesSchema = new mongoose.Schema({
  
    identifier: {
      type: String,
      // required: true,
      unique: true,
    },
    image: {
      type: String,
      // requried: true,
    },
    name: {
      type: String,
      // requried: true,
    },
  },
  { timestamps: true }
);

export const categoriesModel = mongoose.model("categories", categoriesSchema);
