import mongoose from "mongoose";

const categoriesSchema = new mongoose.Schema({
  
   
    image: {
      type: String,
      // requried: true,
    },
    name: {
      type: Object,
      requried: true,
      unique: true,
    },
    module:{
			type: [String],
			enum: ["All","bookMaster","bookSchool","bookMarket","bookStudy","bookUniversity"],
			required: true,
			default: "All"
		},
  },
  { timestamps: true }
);

export const categoriesModel = mongoose.model("categories", categoriesSchema);
