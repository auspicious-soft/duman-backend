import mongoose from "mongoose"
import { string } from "zod"

const cartSchema = new mongoose.Schema({
  userId:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"users",
    required:true
  },
  productId:[{
    type:mongoose.Schema.Types.ObjectId,
    ref:"products",
    required:true
  }],
  buyed: {
  type: String,
  enum: ["pending", "purchased", "cancelled"], // or whatever makes sense for your app
  default: "pending", // optional default
}
},{
  timestamps:true
})

export const cartModel = mongoose.model("carts",cartSchema)