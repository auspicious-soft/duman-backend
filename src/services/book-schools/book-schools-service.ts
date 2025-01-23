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
  const { query, sort } = queryBuilder(payload, ["name", "location"]);

  if (payload.sortField) {
    sort[payload.sortField] = payload.sortOrder === "desc" ? -1 : 1 as 1 | -1;
  } else {
    sort['createdAt'] = 1; 
  }

  try {
    const pipeline: PipelineStage[] = [
      {
        $match: query,
      },
      // {
      //   $sort: sort,
      // },
    ];

    if (limit > 0) {
      pipeline.push(
        { $skip: offset },
        { $limit: limit }
      );
    }

    const totalDataCount = await bookSchoolsModel.countDocuments(query);
    const results = await bookSchoolsModel.aggregate(pipeline);

    return {
      page,
      limit,
      success: true,
      total: totalDataCount,
      data: results,
    };
  } catch (error: any) {
    console.error("Error in getAllBookSchoolsService:", error.message);
    return {
      page,
      limit,
      success: false,
      total: 0,
      data: [],
      error: error.message,
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
