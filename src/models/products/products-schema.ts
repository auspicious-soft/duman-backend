import { Schema, model, Document, Types } from "mongoose";

// Define the Rating type
interface Rating {
  userId: Types.ObjectId;
  rating: number;
  comment?: string;
}

// Extend the Mongoose Document for Products

import mongoose, { Mongoose } from "mongoose";

//  const ratingSchema = new mongoose.Schema({
//   userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
//   rating: { type: Number, required: true, min: 1, max: 5 },
//   productId: { type: mongoose.Schema.Types.ObjectId, ref: "Products", required: true },
//   comment: { type: String },
// });
// export const productRatingsModel = mongoose.model("rating", ratingSchema);

const productsSchema = new mongoose.Schema({
    name: {
      type: Object,
      requried: true,
    },
    description: {
      type: Object,
      requried: true,
    },
    authorId: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "authors",
      required: true,
    },
    categoryId: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "categories",
      required: true,
    },
    subCategoryId: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "subCategories",
      required: true,
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
      type: Map,
      of: { type: String },
    },
    type: {
      type: String,
      enum: ["e-book", "podcast", "audiobook", "course"],
      required: true,
    },
    publisherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "publishers",
    },
    isDiscounted: {
      type: Boolean,
      default: false,
    },
    discountPercentage: {
      type: Number,
      default: null,
    },
    // ratings: [
     
    //     {
    //       userId: { type: mongoose.Schema.Types.ObjectId, ref: "users", required: true },
    //       rating: { type: Number, required: true, min: 1, max: 5 },
    //       comment: { type: String },
    //     },
    // ],
    createdAt: { type: Date, default: Date.now },
    averageRating: { type: Number, default: 0 },
  },
  { timestamps: true }
);


export const productsModel = mongoose.model("products", productsSchema);