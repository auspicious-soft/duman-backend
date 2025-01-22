import mongoose, { Schema } from "mongoose";

const bannerSchema = new mongoose.Schema(
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

export const bannersModel = mongoose.model("banner", bannerSchema);
