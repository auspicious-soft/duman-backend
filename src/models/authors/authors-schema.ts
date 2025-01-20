import mongoose, { Schema } from "mongoose";

const usersSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      requried: true,
    },
     categoryId: [{
          type: mongoose.Schema.Types.ObjectId,
          ref: "categories",
          // requried: true,
        }],
    // bookCount:[{
    //   type: mongoose.Schema.Types.ObjectId,
    //       ref: "categories",
    // }],
    Description: {
      type: String,
    },
    
    image: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

export const usersModel = mongoose.model("users", usersSchema);
