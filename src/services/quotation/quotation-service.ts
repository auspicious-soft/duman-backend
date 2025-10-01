import { queryBuilder } from "src/utils";
import { errorResponseHandler } from "src/lib/errors/error-response-handler";
import { httpStatusCode } from "src/lib/constant";
import { Response } from "express";
import { quotationModel } from "src/models/quotation/quotation-schema";

export interface Event {
  _id?: string;
  identifier: string;
  image: string;
  name: string;
  description: string;
}

export const createQuotation = async (Data: Event) => {

  const quote = new quotationModel(Data);
  const savedQuote = await quote.save();
  return {savedQuote, success: true, message: "Quote created successfully"};
};

export const getQuotationById = async (quotationId: string): Promise<Event | null> => {
  return await quotationModel.findById(quotationId);
};

export const updateQuotation = async (
  quotationId: string,
  quotationData: Event
): Promise<Event | null> => {
  return await quotationModel.findByIdAndUpdate(quotationId, quotationData, { new: true });
};
export const deleteQuotation = async (quotationId: string, res: Response) => {
  const deletedQuotation = await quotationModel.findByIdAndDelete(quotationId);
  if (!deletedQuotation) return errorResponseHandler("Quotation not found", httpStatusCode.NOT_FOUND, res);
  return {
      success: true,
      message: "Quotation Deleted successfully",
      data: deletedQuotation,
    };
};

export const getAllQuotations = async (payload: any) => {
  const page = parseInt(payload.page as string) || 1
  const limit = parseInt(payload.limit as string) || 0
  const offset = (page - 1) * limit
  const { query, sort } = queryBuilder(payload, ['name'])

  const totalDataCount = Object.keys(query).length < 1 ? await quotationModel.countDocuments() : await quotationModel.countDocuments(query)
  const results = await quotationModel.find(query).sort({createdAt: -1, ...sort}).skip(offset).limit(limit).select("-__v")
  if (results.length) return {
      page,
      limit,
      success: true,
      message: "Quotations retrieved successfully",
      total: totalDataCount,
      data: results
  }
  else {
      return {
          data: [],
          page,
          limit,
          success: false,
          message: "No Quotations found",
          total: 0
      }
  }
}
export const getAllQuotationsForUser = async (payload: any) => {
  // const page = parseInt(payload.page as string) || 1
  // const limit = parseInt(payload.limit as string) || 0
  // const offset = (page - 1) * limit
  const { query, sort } = queryBuilder(payload, ['name'])

  const totalDataCount = Object.keys(query).length < 1 ? await quotationModel.countDocuments() : await quotationModel.countDocuments(query)
  const results = await quotationModel.find(query).sort({createdAt: -1, ...sort})
  // .skip(offset).limit(limit)
  .select("-__v")
  if (results.length) return {
      // page,
      // limit,
      success: true,
      message: "Quotations retrieved successfully",
      total: totalDataCount,
      data: results
  }
  else {
      return {
          data: [],
          // page,
          // limit,
          success: false,
          message: "No events found",
          total: 0
      }
  }
}
