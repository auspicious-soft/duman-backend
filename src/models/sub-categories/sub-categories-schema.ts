import mongoose, { Mongoose } from "mongoose";

const categoriesSchema = new mongoose.Schema(
  {
    identifier: {
      type: String,
      // required: true,    
      unique: true,
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "categories",
    },
    image: {
      type: String,
    //   requried: true,
    },
    name: {
      type: String,
      requried: true,
    },
  },
  { timestamps: true }
);

export const categoriesModel = mongoose.model("events", categoriesSchema);
