import mongoose, { Mongoose } from "mongoose";

const booksSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      requried: true,
    },
    description: {
      type: String,
      requried: true,
    },
    authorId: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
    }],
    categoryId: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "categories",
      required: true,
    }],
    subCategoryId:[{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'subCategories',
      required: true,
  }],
    language: {
      type: [String],
      requried: true,
    },
    price: {
      type: Number,
      requried: true,
    },
    genre: {
      type: [String],
      requried: true,
    },
    image: {
      type: String,
    },
    file: {
      type: String,
    },
  },
  { timestamps: true }
);

export const booksModel = mongoose.model("books", booksSchema);
