import mongoose, { Mongoose } from "mongoose";

const subCategoriesSchema = new mongoose.Schema(
  {
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "categories",
      // requried: true,
    },
    image: {
      type: String,
    //   requried: true,
    },
    name: {
      type: Object,
      requried: true,
    },
  },
  { timestamps: true }
);

export const subCategoriesModel = mongoose.model("subCategories", subCategoriesSchema);
