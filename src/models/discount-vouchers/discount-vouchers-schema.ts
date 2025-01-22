import { Schema, model } from 'mongoose';

const discountVouchersSchema = new Schema({
   
    couponCode: {
        type: String,
        required: true
    },
    percentage :{
        type:Number,
        required: true
    },
  
},
    { timestamps: true }
)

export const discountVouchersModel = model('discountVouchers', discountVouchersSchema)