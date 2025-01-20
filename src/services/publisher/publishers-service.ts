import { Response } from "express";
import { errorResponseHandler } from "../../lib/errors/error-response-handler";
import { httpStatusCode } from "../../lib/constant";

import { queryBuilder } from "src/utils";
import { publishersModel } from "../../models/publishers/publishers-schema";

export const createPublisherService = async (payload: any, res: Response) => {
  const newPublisher = new publishersModel(payload);
  const savedPublisher = await newPublisher.save();
  return {
    success: true,
    message: "Publisher created successfully",
    data: savedPublisher,
  };
};

export const getPublisherService = async (id: string, res: Response) => {
  const publisher = await publishersModel.findById(id).populate("categoryId");
  if (!publisher)
    return errorResponseHandler(
      "Publisher not found",
      httpStatusCode.NOT_FOUND,
      res
    );
  return {
    success: true,
    message: "Publisher retrieved successfully",
    data: publisher,
  };
};

export const getAllPublishersService = async (payload: any, res: Response) => {
  const page = parseInt(payload.page as string) || 1;
  const limit = parseInt(payload.limit as string) || 0;
  const offset = (page - 1) * limit;
  const { query, sort } = queryBuilder(payload, ["name"]);

  const totalDataCount =
    Object.keys(query).length < 1
      ? await publishersModel.countDocuments()
      : await publishersModel.countDocuments(query);
  const results = await publishersModel
    .find(query)
    .sort(sort)
    .skip(offset)
    .limit(limit)
    .populate("categoryId")
    .select("-__v");
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

export const updatePublisherService = async (
  id: string,
  payload: any,
  res: Response
) => {
  const updatedPublisher = await publishersModel.findByIdAndUpdate(id, payload, {
    new: true,
  });
  if (!updatedPublisher)
    return errorResponseHandler(
      "Publisher not found",
      httpStatusCode.NOT_FOUND,
      res
    );
  return {
    success: true,
    message: "Publisher updated successfully",
    data: updatedPublisher,
  };
};

export const deletePublisherService = async (id: string, res: Response) => {
  const deletedPublisher = await publishersModel.findByIdAndDelete(id);
  if (!deletedPublisher)
    return errorResponseHandler(
      "Publisher not found",
      httpStatusCode.NOT_FOUND,
      res
    );

  return {
    success: true,
    message: "Publisher deleted successfully",
    data: deletedPublisher,
  };
};
