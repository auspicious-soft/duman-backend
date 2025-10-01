import mongoose from "mongoose";

const quotationSchema = new mongoose.Schema(
  {
    quote: {
      type: {
        eng: { type: String, default: null },
        rus: { type: String, default: null },
        kaz: { type: String, default: null },
      },
      required: true,
      trim: true,
      default: {
        eng: null,
        rus: null,
        kaz: null,
      },
    },
  },
  { timestamps: true }
);

export const quotationModel = mongoose.model("quotation", quotationSchema);
