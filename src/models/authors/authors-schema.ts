import mongoose, { Schema } from "mongoose";

const authorsSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      requried: true,
    },
   
    profession:{
      type: [String],
    },
    country: {
      type: String,
    },
    
    dob: {
      type: Date,
    },
    genres: {
      type: [String],
    },

    image: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

export const authorsModel = mongoose.model("authors", authorsSchema);
