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
    sections:[{
      name:{type:String},
      order:{type:Number},
      file:{type:String},
      additionalMaterials:{type:Object},
      additionalLinks:{type:Object}
    }],
  
  },
  { timestamps: true }
);


export const courseLessonsModel = mongoose.model("courseLessons", courseLessonsSchema);