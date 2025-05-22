import mongoose from "mongoose";

const audiobookChaptersSchema = new mongoose.Schema({
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
    srNo: {
      type: Number,
      required: true,
    },
    file:{
      type:String
    }
  
  },
  { timestamps: true }
);


export const audiobookChaptersModel = mongoose.model("audiobookChapters", audiobookChaptersSchema);