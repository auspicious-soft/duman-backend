import mongoose from "mongoose";

const courseLessonsSchema = new mongoose.Schema({
    lang: {
      type: String,
      requried: true,
    },
    name: {
      type: String,
      requried: true,
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "products",
      required: true,
    },
    order: {
      type: Number,
      required: true,
    },
    file: {
      type: Object,
      required: true,
    },
  
  },
  { timestamps: true }
);


export const courseLessonsModel = mongoose.model("courseLessons", courseLessonsSchema);