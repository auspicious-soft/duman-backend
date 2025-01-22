import { Schema, model } from 'mongoose';

const discountedBooksSchema = new Schema({
    booksId: {
        type: [Schema.ObjectId],
        ref: "products"
    },
   
},
    { timestamps: true }
)

export const discountedBooksModel = model('discountedBooks', discountedBooksSchema)