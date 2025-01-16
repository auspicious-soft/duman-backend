import { Response } from "express";
import { errorResponseHandler } from "../../lib/errors/error-response-handler";
import { httpStatusCode } from "../../lib/constant";
import { booksModel } from "../../models/books/books-schema";
import { queryBuilder } from "src/utils";


export const createBookService = async (payload: any, res: Response) => {
    console.log('payload: ', payload);
        const newBook = new booksModel(payload);
        const savedBook = await newBook.save();
        return {
            success: true,
            message: "Book created successfully",
            data: savedBook,
        };
};

export const getBooksService = async (id: string, res: Response) => {
    try {
        const books = await booksModel.findById(id);
        return {
            success: true,
            data: books,
        };
    } catch (error) {
        return errorResponseHandler('Failed to fetch books', httpStatusCode.INTERNAL_SERVER_ERROR, res);
    }
    
};

export const getAllBooksService = async (payload:any ,res: Response) => {
    // try {
    //     const books = await booksModel.find();
    //     return {
    //         success: true,
    //         data: books,
    //     };
    // } catch (error) {
    //     return errorResponseHandler('Failed to fetch books', httpStatusCode.INTERNAL_SERVER_ERROR, res);
    // }
    const page = parseInt(payload.page as string) || 1
          const limit = parseInt(payload.limit as string) || 0
          const offset = (page - 1) * limit
          const { query, sort } = queryBuilder(payload, ['name'])
         
          const totalDataCount = Object.keys(query).length < 1 ? await booksModel.countDocuments() : await booksModel.countDocuments(query)
          const results = await booksModel.find(query).sort(sort).skip(offset).limit(limit).populate('categoryId');
          if (results.length) return {
              page,
              limit,
              success: true,
              total: totalDataCount,
              data: results
          }
          else {
              return {
                  data: [],
                  page,
                  limit,
                  success: false,
                  total: 0
              }
          }
};

export const getBookByIdService = async (id: string, res: Response) => {
    try {
        const book = await booksModel.findById(id);
        if (!book) return errorResponseHandler("Book not found", httpStatusCode.NOT_FOUND, res);
        return {
            success: true,
            data: book,
        };
    } catch (error) {
        return errorResponseHandler('Failed to fetch book', httpStatusCode.INTERNAL_SERVER_ERROR, res);
    }
};

export const updateBookService = async (id: string, payload: any, res: Response) => {
    try {
        const updatedBook = await booksModel.findByIdAndUpdate(id, payload, { new: true });
        if (!updatedBook) return errorResponseHandler("Book not found", httpStatusCode.NOT_FOUND, res);
        return {
            success: true,
            message: "Book updated successfully",
            data: updatedBook,
        };
    } catch (error) {
        return errorResponseHandler('Failed to update book', httpStatusCode.INTERNAL_SERVER_ERROR, res);
    }
};

export const deleteBookService = async (id: string, res: Response) => {
    try {
        const deletedBook = await booksModel.findByIdAndDelete(id);
        if (!deletedBook) return errorResponseHandler("Book not found", httpStatusCode.NOT_FOUND, res);
        return {
            success: true,
            message: "Book deleted successfully",
            data: deletedBook,
        };
    } catch (error) {
        return errorResponseHandler('Failed to delete book', httpStatusCode.INTERNAL_SERVER_ERROR, res);
    }
};
