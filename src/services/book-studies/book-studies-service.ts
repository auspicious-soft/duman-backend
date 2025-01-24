import { Response } from "express";
import { errorResponseHandler } from "../../lib/errors/error-response-handler";
import { httpStatusCode } from "../../lib/constant";
import { queryBuilder } from "src/utils";
import { bookStudiesModel } from "../../models/book-studies/book-studies-schema"; // Import bookStudiesModel


export const createBookStudyService = async (payload: any, res: Response) => {
  const newBookStudy = new bookStudiesModel(payload);
  const savedBookStudy = await newBookStudy.save();
  return {
    success: true,
    message: "Book study created successfully",
    data: savedBookStudy,
  };
};

export const getBookStudyService = async (id: string, res: Response) => {
  const bookStudy = await bookStudiesModel.findById(id);
  if (!bookStudy) return errorResponseHandler("Book study not found", httpStatusCode.NOT_FOUND, res);
  return {
    success: true,
    message: "Book study retrieved successfully",
    data: bookStudy,
  };
};

export const getAllBookStudiesService = async (payload: any, res: Response) => {
  const page = parseInt(payload.page as string) || 1;
  const limit = parseInt(payload.limit as string) || 0;
  const offset = (page - 1) * limit;
  const { query, sort } = queryBuilder(payload, ["title"]);

  const totalDataCount = Object.keys(query).length < 1 ? await bookStudiesModel.countDocuments() : await bookStudiesModel.countDocuments(query);
  const results = await bookStudiesModel.find(query).sort(sort).skip(offset).limit(limit).select("-__v");
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

export const updateBookStudyService = async (id: string, payload: any, res: Response) => {
  const updatedBookStudy = await bookStudiesModel.findByIdAndUpdate(id, payload, {
    new: true,
  });
  if (!updatedBookStudy) return errorResponseHandler("Book study not found", httpStatusCode.NOT_FOUND, res);
  
  return {    
    success: true,
    message: "Book study updated successfully",
    data: updatedBookStudy,
  };
};

export const deleteBookStudyService = async (id: string, res: Response) => {
  const deletedBookStudy = await bookStudiesModel.findByIdAndDelete(id);
  if (!deletedBookStudy) return errorResponseHandler("Book study not found", httpStatusCode.NOT_FOUND, res);
  
  return {
    success: true,
    message: "Book study deleted successfully",
    data: deletedBookStudy,
  };
};
