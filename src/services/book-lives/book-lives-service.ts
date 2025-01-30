import { Response } from "express";
import { errorResponseHandler } from "../../lib/errors/error-response-handler";
import { httpStatusCode } from "../../lib/constant";
import { queryBuilder } from "src/utils";
import { deleteFileFromS3 } from "src/config/s3";
import { bookLivesModel } from "../../models/book-lives/book-lives-schema";
import { blogsModel } from "src/models/blogs/blogs-schema";


export const createBookLiveService = async (payload: any, res: Response) => {
  const newBookLive = new bookLivesModel(payload);
  const savedBookLive = await newBookLive.save();
  return {
    success: true,
    message: "Book live created successfully",
    data: savedBookLive,
  };
};

export const getBookLiveService = async (id: string, res: Response) => {
  const bookLive = await bookLivesModel.findById(id);
  const blog = await blogsModel.find({categoryId: id});
  console.log('blog: ', blog);
  if (!bookLive)
    return errorResponseHandler(
      "Book live not found",
      httpStatusCode.NOT_FOUND,
      res
    );
  return {
    success: true,
    message: "Book live retrieved successfully",
    data: {bookLive,blog},
  };
};

export const getAllBookLivesService = async (payload: any, res: Response) => {
  const page = parseInt(payload.page as string) || 1;
  const limit = parseInt(payload.limit as string) || 0;
  const offset = (page - 1) * limit;
  const { query, sort } = queryBuilder(payload, ["title"]);

  const totalDataCount =
    Object.keys(query).length < 1
      ? await bookLivesModel.countDocuments()
      : await bookLivesModel.countDocuments(query);
  const results = await bookLivesModel
    .find(query)
    .sort(sort)
    .skip(offset)
    .limit(limit)
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

export const updateBookLiveService = async (
  id: string,
  payload: any,
  res: Response
) => {
  const updatedBookLive = await bookLivesModel.findByIdAndUpdate(id, payload, {
    new: true,
  });
  if (!updatedBookLive)
    return errorResponseHandler(
      "Book live not found",
      httpStatusCode.NOT_FOUND,
      res
    );
  return {
    success: true,
    message: "Book live updated successfully",
    data: updatedBookLive,
  };
};

export const deleteBookLiveService = async (id: string, res: Response) => {
  const deletedBookLive = await bookLivesModel.findByIdAndDelete(id);
  if (!deletedBookLive)
    return errorResponseHandler(
      "Book live not found",
      httpStatusCode.NOT_FOUND,
      res
    );
  if(deletedBookLive?.image){
    await deleteFileFromS3(deletedBookLive?.image)
  }
  return {
    success: true,
    message: "Book live deleted successfully",
    data: deletedBookLive,
  };
};
