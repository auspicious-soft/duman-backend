import { Response } from "express";
import { errorResponseHandler } from "../../lib/errors/error-response-handler";
import { httpStatusCode } from "../../lib/constant";
import { nestedQueryBuilder } from "src/utils";
import { deleteFileFromS3 } from "src/config/s3";
import { summariesModel } from "../../models/summaries/summaries-schema";


export const createSummaryService = async (payload: any, res: Response) => {
  const newSummary = new summariesModel(payload);
  const savedSummary = await newSummary.save();
  return {
    success: true,
    message: "Summary created successfully",
    data: savedSummary,
  };
};

export const getSummaryService = async (id: string, res: Response) => {
  const summary = await summariesModel.findById(id).populate({
    path: "booksId",
    populate: { path: "authorId" }
  });
  if (!summary) return errorResponseHandler("Summary not found", httpStatusCode.NOT_FOUND, res);
  return {
    success: true,
    message: "Summary retrieved successfully",
    data: summary,
  };
};

export const getAllSummariesService = async (payload: any, res: Response) => {
  const page = parseInt(payload.page as string) || 1;
  const limit = parseInt(payload.limit as string) || 0;
  const offset = (page - 1) * limit;
  const { query, sort } = nestedQueryBuilder(payload, ["name"]);

  const totalDataCount = Object.keys(query).length < 1 ? await summariesModel.countDocuments() : await summariesModel.countDocuments(query);
  const results = await summariesModel.find(query).sort(sort).skip(offset).limit(limit).select("-__v");
  if (results.length)
    return {
      page,
      limit,
      success: true,
      message: "Summaries retrieved successfully",
      total: totalDataCount,
      data: results,
    };
  else {
    return {
      data: [],
      page,
      limit,
      success: false,
      message: "No summaries found",
      total: 0,
    };
  }
};

export const updateSummaryService = async (id: string, payload: any, res: Response) => {
  const updatedSummary = await summariesModel.findByIdAndUpdate(id, payload, {
    new: true,
  });
  if (!updatedSummary) return errorResponseHandler("Summary not found", httpStatusCode.NOT_FOUND, res);
  
  return {    
    success: true,
    message: "Summary updated successfully",
    data: updatedSummary,
  };
};

export const addBooksToSummaryService = async (id: string, payload: any, res: Response) => {
  const updatedSummary = await summariesModel.findByIdAndUpdate(
    id,
    { $addToSet: { booksId: { $each: payload.booksId } } },
    { new: true }
  );
  if (!updatedSummary) return errorResponseHandler("Summary not found", httpStatusCode.NOT_FOUND, res);
  
  return {    
    success: true,
    message: "Collection updated successfully",
    data: updatedSummary,
  };
};

export const deleteSummaryService = async (id: string, res: Response) => {
  const deletedSummary = await summariesModel.findByIdAndDelete(id);
  if (!deletedSummary) return errorResponseHandler("Summary not found", httpStatusCode.NOT_FOUND, res);
  if (deletedSummary?.image) {
      await deleteFileFromS3(deletedSummary.image);
  }
  return {
    success: true,
    message: "Summary deleted successfully",
    data: deletedSummary,
  };
};
