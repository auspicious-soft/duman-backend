import mongoose, { Mongoose } from "mongoose";

const subCategoriesSchema = new mongoose.Schema(
  {
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

export const subCategoriesModel = mongoose.model("subCategories", subCategoriesSchema);
