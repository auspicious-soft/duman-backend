import mongoose, { Schema, model } from "mongoose";

const bookSchoolsSchema = new Schema(
  {
    couponCode: {
      type: String,
      required: true,

    },
    publisherId: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "publishers",
      required: true
    },
    name:{
        type: Object,
        required: true
    },
    allowedActivation:{
        type: Number,
        required: true
    },
    codeActivation:{
        type: Number,
        default:0,
        required: true
    },
    
  },
  { timestamps: true }
);

export const bookSchoolsModel = model("bookSchools", bookSchoolsSchema);
