import { Response } from "express";
import { errorResponseHandler } from "../../lib/errors/error-response-handler";
import { httpStatusCode } from "../../lib/constant";
import { queryBuilder } from "src/utils";
import { bookSchoolsModel } from "../../models/book-schools/book-schools-schema";
import { PipelineStage } from "mongoose";

export const createBookSchoolService = async (payload: any, res: Response) => {
  const newBookSchool = new bookSchoolsModel(payload);
  const savedBookSchool = await newBookSchool.save();
  return {
    success: true,
    message: "Book school created successfully",
    data: savedBookSchool,
  };
};

export const getBookSchoolService = async (id: string, res: Response) => {
  const bookSchool = await bookSchoolsModel.findById(id);
  if (!bookSchool) return errorResponseHandler("Book school not found", httpStatusCode.NOT_FOUND, res);
  return {
    success: true,
    message: "Book school retrieved successfully",
    data: bookSchool,
  };
};

export const getAllBookSchoolsService = async (payload: any, res: Response) => {
    const page = parseInt(payload.page as string) || 1;
    const limit = parseInt(payload.limit as string) || 0;
    const offset = (page - 1) * limit;
    const { query, sort } = queryBuilder(payload,["name"]);
  
    const totalDataCount = Object.keys(query).length < 1 ? await bookSchoolsModel.countDocuments() : await bookSchoolsModel.countDocuments(query);
    const results = await bookSchoolsModel.find(query).sort(sort).skip(offset).limit(limit).select("-__v");
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

export const updateBookSchoolService = async (id: string, payload: any, res: Response) => {
  const updatedBookSchool = await bookSchoolsModel.findByIdAndUpdate(id, payload, {
    new: true,
  });
  if (!updatedBookSchool) return errorResponseHandler("Book school not found", httpStatusCode.NOT_FOUND, res);
  
  return {    
    success: true,
    message: "Book school updated successfully",
    data: updatedBookSchool,
  };
};

export const deleteBookSchoolService = async (id: string, res: Response) => {
  const deletedBookSchool = await bookSchoolsModel.findByIdAndDelete(id);
  if (!deletedBookSchool) return errorResponseHandler("Book school not found", httpStatusCode.NOT_FOUND, res);
  
  return {
    success: true,
    message: "Book school deleted successfully",
    data: deletedBookSchool,
  };
};
