import mongoose from "mongoose";

const categoriesSchema = new mongoose.Schema({
  
   
    image: {
      type: String,
      // requried: true,
    },
    name: {
      type: String,
      requried: true,
      unique: true,
    },
  },
  { timestamps: true }
);

export const categoriesModel = mongoose.model("categories", categoriesSchema);
