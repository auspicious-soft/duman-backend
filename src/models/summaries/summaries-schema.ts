import mongoose, { Schema } from "mongoose";

const summariesSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      requried: true,
    },
   
    link: {
      type: String,
      requried: true,

    },
    
    image: {
      type: String,
      requried: true,
    },
    
  },
  { timestamps: true }
);

export const summariesModel = mongoose.model("summaries", summariesSchema);
