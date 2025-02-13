import mongoose from "mongoose";

const readProgressSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },
    bookId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "products",
      required: true,
    },
    progress: {
      type: Number,
      default: 0,
    },
    readSections: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "courseLessons.sections",
      required: false, 
    }],
    certificate: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

export const readProgressModel = mongoose.model("readProgress", readProgressSchema);
