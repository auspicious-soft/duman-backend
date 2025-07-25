import mongoose from "mongoose";

const faqsSchema = new mongoose.Schema(
  {
    identifier: {
      type: String,
      // required: true,
      unique: true,
    },
    question: {
      type: String,
      required: true,
    },
    answer: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["text", "video", "image"],
      default: "text",
    },
  },
  { timestamps: true }
);

export const faqsModel = mongoose.model("faqs", faqsSchema);
