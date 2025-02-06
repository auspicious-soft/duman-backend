import { Response } from "express";
import mongoose from "mongoose";
import { errorResponseHandler } from "../../lib/errors/error-response-handler";
import { httpStatusCode } from "../../lib/constant";
import { productsModel, } from "../../models/products/products-schema";
import { nestedQueryBuilder, queryBuilder } from "src/utils";
import { deleteFileFromS3 } from "src/config/s3";
import { productRatingsModel } from "src/models/ratings/ratings-schema";
import { ordersModel } from "src/models/orders/orders-schema";
import { favoritesModel } from "src/models/favorites/favorites-schema";
import { collectionsModel } from "src/models/collections/collections-schema";
import { categoriesModel } from "src/models/categories/categroies-schema";
import { readProgressModel } from "src/models/read-progress/read-progress-schema";
import { publishersModel } from "src/models/publishers/publishers-schema";
import { authorsModel } from "src/models/authors/authors-schema";

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
    const books = await productsModel.find({ _id: id }).populate([
      { path: "authorId" },
      { path: "categoryId" },
      { path: "subCategoryId" },
      { path: "publisherId" }
    ]);
    if (!books || books.length === 0) {
      return errorResponseHandler("Book not found", httpStatusCode.NOT_FOUND, res);
    }

    const bookPrice = books[0]?.price;

    if (!bookPrice) {
      return errorResponseHandler("Book price not available", httpStatusCode.NOT_FOUND, res);
    }

    const orders = await ordersModel.find({ productIds: id });
    const totalBookSold = orders.length;
    const totalRevenue = totalBookSold * bookPrice;

    return {
      success: true,
      message: "Books retrieved successfully",
      data: {
        books,
        totalBookSold,
        totalRevenue
      },
    };
  } catch (error) {
    return errorResponseHandler("Failed to fetch books", httpStatusCode.INTERNAL_SERVER_ERROR, res);
  }
};


export const getAllBooksService = async (payload: any, res: Response) => {
  const page = parseInt(payload.page as string) || 1;
  const limit = parseInt(payload.limit as string) || 0;
  const offset = (page - 1) * limit;

  
  const query: any = payload.type ? { type: payload.type } : {}; 
  
  const sort: any = {};
  if (payload.orderColumn && payload.order) {
    sort[payload.orderColumn] = payload.order === "asc" ? 1 : -1;
  }
  

  const results = await productsModel
    .find(query)
    .sort(sort)
    .skip(offset)
    .limit(limit)
    .select("-__v")
    .populate([
        { path: "authorId" },
        { path: "categoryId" },
        { path: "subCategoryId" },
        { path: "publisherId" },
    ])
    .lean();

    let filteredResults = results;
    let totalDataCount
    totalDataCount = await productsModel.countDocuments(query)
  if (payload.description) {
    const searchQuery = payload.description.toLowerCase();

    filteredResults = results.filter((book) => {
      const product = book as any;
      const authors = book?.authorId;
      const productNames = product?.name
      ? Object.values(product.name).map((val: any) => val.toLowerCase())
      : [];

      const authorNames: string[] = (authors as any[]).flatMap((author) =>
        author && author.name ? Object.values(author.name).map((val: any) => val.toLowerCase()) : []
    );
      return (
        productNames.some((name) => name.includes(searchQuery)) ||
        authorNames.some((name) => name.includes(searchQuery))
      );
    })
    totalDataCount = filteredResults.length
  }
  return {
    page,
    limit,
    message: "Books retrieved successfully",
    success: filteredResults.length > 0,
    total: filteredResults.length > 0 ? totalDataCount : 0,
    data: filteredResults,
  };
};
export const getAllDiscountedBooksService = async (payload: any, res: Response) => {
  const page = parseInt(payload.page as string) || 1;
  const limit = parseInt(payload.limit as string) || 0;
  const offset = (page - 1) * limit;
  const { query, sort } = nestedQueryBuilder(payload, ["name"]) as { query: any; sort: any };

  if (payload.isDiscounted) {
    query.isDiscounted = payload.isDiscounted;
  }
  if (payload.type) {
    query.type = payload.type;
  }
  const totalDataCount = Object.keys(query).length < 1 ? await productsModel.countDocuments() : await productsModel.countDocuments(query);
  const results = await productsModel.find(query).sort(sort).skip(offset).limit(limit).populate([{ path: "authorId" }, { path: "categoryId" }, { path: "subCategoryId" }, { path: "publisherId" }]);
  if (results.length)
    return {
      page,
      limit,
      success: true,
      message: "Books retrieved successfully",
      total: totalDataCount,
      data: results,
    };
  else {
    return {
      data: [],
      page,
      limit,
      success: false,
      message: "No books found",
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
      message: "Book retrieved successfully",
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
    if (deletedBook?.file && deletedBook.file instanceof Map) {
      for (const key of deletedBook.file.keys()) {
        const fileValue = deletedBook.file.get(key);
        if (fileValue && typeof fileValue === 'string') {
          await deleteFileFromS3(fileValue);
        }
      }
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



export const getProductsForHomePage = async () => {
  try {
    const books = await productsModel.find({ type: 'e-book' }).limit(10);
    const courses = await productsModel.find({ type: 'course' }).limit(10);

    return { books:books, courses:courses , success: true, message: "Products retrieved successfully" };
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const getBookForUserService = async (id: string, user: any, res: Response) => {
    const book = await productsModel.findById(id).populate([
      { path: "authorId" },
      { path: "categoryId" },
      { path: "subCategoryId" },
      { path: "publisherId" }
    ]);

    const readers = await readProgressModel.countDocuments({ bookId: id });
    if (!book) {
      return errorResponseHandler("Book not found", httpStatusCode.NOT_FOUND, res);
    }
    const isFavorite = await favoritesModel.exists({ userId: user.id, productId: id });
    const relatedBooks = await productsModel.find({ categoryId: { $in: book?.categoryId} }).populate([
      { path: "authorId"  },
    ]);

    return {
      success: true,
      message: "Book retrieved successfully",
      data: {
        book: {
          ...book.toObject(), 
          favorite: isFavorite? true : false,
          readers: readers > 0 ? readers : 0
        },
        relatedBooks: relatedBooks
      },
    };
  
};

export const getBookMarketForUserService = async (user:any, res: Response) => {
  const categories = await categoriesModel.find();
  const collections = await collectionsModel.find()
  .populate({
    path: "booksId",
    populate: [
      { path: "authorId",select: "name" }
    ],
  });
  const publisher = await publishersModel.find().limit(10);
  const author = await authorsModel.find().limit(10);
  const readProgress = await readProgressModel.find({ userId: user.id }).populate({
    path: "bookId",
    populate: [
      { path: "authorId",select: "name" }
    ],
  });
  const audiobooks = await productsModel.find({ type: 'audiobook' }).populate([
    { path: "authorId",select: "name" },
    { path: "categoryId",select: "name" },
  ]);
  const bestSellers = await ordersModel.aggregate([
    {
      $group: {
        _id: "$bookId",  // Group by bookId (assuming this is the field linking to the product)
        orderCount: { $sum: 1 }  // Count how many times this book was ordered
      }
    },
    {
      $sort: { orderCount: -1 }  // Sort by the orderCount in descending order (most ordered first)
    },
    {
      $limit: 10  // Limit to the top 10 bestsellers
    },
    {
      $lookup: {
        from: "products",  // Assuming the products collection is named "products"
        localField: "_id",  // The bookId from the ordersModel
        foreignField: "_id",  // The _id field in the productsModel
        as: "book"  // Name of the field to store the populated data
      }
    },
    {
      $unwind: "$book"  // Flatten the array of books to have each book object directly
    },
    {
      $project: {
        _id: 0,  // Exclude the _id field from the final result
        book: 1  // Include the book data
      }
    }
  ]);
  console.log(bestSellers);
  // Best sellers will contain the top 10 books sorted by order count
  
  const newBooks = await productsModel
  .find({ type: 'e-book' })
  .sort({ createdAt: -1 })  // Sort by createdAt in descending order (latest first)
  .limit(20)  // Limit the results to the latest 20 books
  .populate([
    { path: "authorId", select: "name" },
    { path: "categoryId", select: "name" },
  ]);

  return {
    success: true,
    message: "Book retrieved successfully",
    data: {
      readProgress: readProgress,
      audiobooks: audiobooks,
      categories: categories,
      collections: collections,
      publisher: publisher,
      author: author,
      newBooks: newBooks,
      bestSellers: bestSellers
    },
  };
}