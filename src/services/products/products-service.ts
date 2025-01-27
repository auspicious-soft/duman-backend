import { Response } from "express";
import mongoose from "mongoose";
import { errorResponseHandler } from "../../lib/errors/error-response-handler";
import { httpStatusCode } from "../../lib/constant";
import { productsModel, } from "../../models/products/products-schema";
import { queryBuilder } from "src/utils";
import { deleteFileFromS3 } from "src/configF/s3";
import { productRatingsModel } from "src/models/ratings/ratings-schema";

export const createBookService = async (payload: any, res: Response) => {
  const newBook = new productsModel(payload);
  const savedBook = await newBook.save();
  return {
    success: true,
    message: "Book created successfully",
    data: savedBook,
  };
};

export const getBooksService = async (id: string, res: Response) => {
  try {
    const books = await productsModel.find({ _id: id }).populate([{ path: "authorId" }, { path: "categoryId" }, { path: "subCategoryId" }, { path: "publisherId" }]);
    return {
      success: true,
      data: books,
    };
  } catch (error) {
    return errorResponseHandler("Failed to fetch books", httpStatusCode.INTERNAL_SERVER_ERROR, res);
  }
};

export const getAllBooksService = async (payload: any, res: Response) => {
  const page = parseInt(payload.page as string) || 1;
  const limit = parseInt(payload.limit as string) || 0;
  const offset = (page - 1) * limit;
  const { query, sort } = queryBuilder(payload, ["name"]) as { query: any; sort: any };

  // Add filter based on type
  if (payload.type) {
    query.type = payload.type;
  }

  const totalDataCount = Object.keys(query).length < 1 ? await productsModel.countDocuments() : await productsModel.countDocuments(query);
  const results = await productsModel.find(query).sort(sort).skip(offset).limit(limit).populate("authorId");
  if (results.length)
    return {
      page,
      limit,
      success: true,
      total: totalDataCount,
      data: results,
    };
  else {
    return {
      data: [],
      page,
      limit,
      success: false,
      total: 0,
    };
  }
};

export const getAllDiscountedBooksService = async (payload: any, res: Response) => {
  const page = parseInt(payload.page as string) || 1;
  const limit = parseInt(payload.limit as string) || 0;
  const offset = (page - 1) * limit;
  const { query, sort } = queryBuilder(payload, ["name"]) as { query: any; sort: any };

  if (payload.isDiscounted) {
    query.isDiscounted = payload.isDiscounted;
  }
  if (payload.type) {
    query.type = payload.type;
  }
  const totalDataCount = Object.keys(query).length < 1 ? await productsModel.countDocuments() : await productsModel.countDocuments(query);
  const results = await productsModel.find(query).sort(sort).skip(offset).limit(limit).populate("categoryId").populate("publisherId").populate("authorId");
  if (results.length)
    return {
      page,
      limit,
      success: true,
      total: totalDataCount,
      data: results,
    };
  else {
    return {
      data: [],
      page,
      limit,
      success: false,
      total: 0,
    };
  }
};

export const getBookByIdService = async (id: string, res: Response) => {
  try {
    const book = await productsModel.findById(id);
    if (!book) return errorResponseHandler("Book not found", httpStatusCode.NOT_FOUND, res);
    return {
      success: true,
      data: book,
    };
  } catch (error) {
    return errorResponseHandler("Failed to fetch book", httpStatusCode.INTERNAL_SERVER_ERROR, res);
  }
};

export const updateBookService = async (id: string, payload: any, res: Response) => {
  try {
    const updatedBook = await productsModel.findByIdAndUpdate(id, payload, { new: true });
    if (!updatedBook) return errorResponseHandler("Book not found", httpStatusCode.NOT_FOUND, res);
    return {
      success: true,
      message: "Book updated successfully",
      data: updatedBook,
    };
  } catch (error) {
    return errorResponseHandler("Failed to update book", httpStatusCode.INTERNAL_SERVER_ERROR, res);
  }
};

export const addBookToDiscountsService = async (payload: any, res: Response) => {
    try {
      const { booksId, discountPercentage } = payload;
  
      // Convert booksId to ObjectId
    //   const objectIdArray = booksId.map((id: string) => new mongoose.Types.ObjectId(id));
  
      const updatedBooks = await productsModel.updateMany(
        { _id: { $in: booksId } },
        {
          $set: {
            discountPercentage,
            isDiscounted: true,
          },
        }
      );
  
      if (updatedBooks.modifiedCount === 0) return errorResponseHandler("No books found to update", httpStatusCode.NOT_FOUND, res);
  
      return {
        success: true,
        message: "Books updated successfully",
        data: updatedBooks,
      };
    } catch (error) {
      console.error('Error updating books:', error); // Log the error for debugging
      return errorResponseHandler("Failed to update books", httpStatusCode.INTERNAL_SERVER_ERROR, res);
    }
  };

export const removeBookFromDiscountsService = async (payload:any, res: Response) => {
    try {
        const { booksId  } = payload;
    
        const updatedBooks = await productsModel.updateMany(
          { _id: { $in: booksId } },
          {
            $set: {
              discountPercentage:null,
              isDiscounted: false,
            },
          }
        );
    
        if (updatedBooks.modifiedCount === 0) return errorResponseHandler("No books found to update", httpStatusCode.NOT_FOUND, res);
    
        return {
          success: true,
          message: "Books updated successfully",
          data: updatedBooks,
        };
      } catch (error) {
        console.error('Error updating books:', error); // Log the error for debugging
        return errorResponseHandler("Failed to update books", httpStatusCode.INTERNAL_SERVER_ERROR, res);
      }
    };
export const deleteBookService = async (id: string, res: Response) => {
  try {
    const deletedBook = await productsModel.findByIdAndDelete(id);
    if (!deletedBook) return errorResponseHandler("Book not found", httpStatusCode.NOT_FOUND, res);
    if (deletedBook?.image) {
      await deleteFileFromS3(deletedBook.image);
    }
    return {
      success: true,
      message: "Book deleted successfully",
      data: deletedBook,
    };
  } catch (error) {
    return errorResponseHandler("Failed to delete book", httpStatusCode.INTERNAL_SERVER_ERROR, res);
  }
};

export const addBookRatingService = async (
  productId: string,
  ratingData: { userId: string; rating: number; comment?: string },
  res: Response
) => {
  try {
    // Find the product
    const product = await productsModel.findById(productId);

    if (!product) {
      return errorResponseHandler("Product not found", httpStatusCode.NOT_FOUND, res);
    }

    // Add the new rating to the productRatingsModel
    const newRating = new productRatingsModel({
      productId: new mongoose.Types.ObjectId(productId),
      userId: new mongoose.Types.ObjectId(ratingData.userId),
      rating: ratingData.rating,
      comment: ratingData.comment || "",
    });
    await newRating.save();

    // Recalculate the average rating
    const ratings = await productRatingsModel.find({ productId: productId });
    const averageRating: number = ratings.reduce((acc: number, rating: { rating: number }) => acc + rating.rating, 0) / ratings.length;

    // Update the product's average rating
    product.averageRating = averageRating;
    await product.save();

    return {
      success: true,
      message: "Rating added successfully",
      data: product,
    };
  } catch (error) {
    return errorResponseHandler("Failed to add rating", httpStatusCode.INTERNAL_SERVER_ERROR, res);
  }
};