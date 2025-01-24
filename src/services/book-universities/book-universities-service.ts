import { Response } from "express";
import { errorResponseHandler } from "../../lib/errors/error-response-handler";
import { httpStatusCode } from "../../lib/constant";
import { queryBuilder } from "src/utils";
import { bookUniversitiesModel } from "../../models/book-universities/book-universities-schema";



export const createBookUniversityService = async (payload: any, res: Response) => {
  const newBookUniversity = new bookUniversitiesModel(payload);
  const savedBookUniversity = await newBookUniversity.save();
  return {
    success: true,
    message: "Book university created successfully",
    data: savedBookUniversity,
  };
};

export const getBookUniversityService = async (id: string, res: Response) => {
  const bookUniversity = await bookUniversitiesModel.findById(id);
  if (!bookUniversity) return errorResponseHandler("Book university not found", httpStatusCode.NOT_FOUND, res);
  return {
    success: true,
    message: "Book university retrieved successfully",
    data: bookUniversity,
  };
};

export const getAllBookUniversitiesService = async (payload: any, res: Response) => {
  const page = parseInt(payload.page as string) || 1;
  const limit = parseInt(payload.limit as string) || 0;
  const offset = (page - 1) * limit;
  const { query, sort } = queryBuilder(payload, ["name"]);

  const totalDataCount = Object.keys(query).length < 1 ? await bookUniversitiesModel.countDocuments() : await bookUniversitiesModel.countDocuments(query);
  const results = await bookUniversitiesModel.find(query).sort(sort).skip(offset).limit(limit).select("-__v");
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

export const updateBookUniversityService = async (id: string, payload: any, res: Response) => {
  const updatedBookUniversity = await bookUniversitiesModel.findByIdAndUpdate(id, payload, {
    new: true,
  });
  if (!updatedBookUniversity) return errorResponseHandler("Book university not found", httpStatusCode.NOT_FOUND, res);
  
  return {    
    success: true,
    message: "Book university updated successfully",
    data: updatedBookUniversity,
  };
};

export const deleteBookUniversityService = async (id: string, res: Response) => {
  const deletedBookUniversity = await bookUniversitiesModel.findByIdAndDelete(id);
  if (!deletedBookUniversity) return errorResponseHandler("Book university not found", httpStatusCode.NOT_FOUND, res);
  
  return {
    success: true,
    message: "Book university deleted successfully",
    data: deletedBookUniversity,
  };
};
