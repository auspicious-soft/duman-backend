import { audiobookChaptersModel } from "../../models/audiobook-chapters/audiobook-chapters-schema";
import { queryBuilder } from "src/utils";
import { errorResponseHandler } from "src/lib/errors/error-response-handler";
import { httpStatusCode } from "src/lib/constant";
import { deleteFileFromS3 } from "src/config/s3";
import { Response } from "express";
import { productsModel } from "src/models/products/products-schema";
import mongoose from "mongoose";
import { createBookService } from "../products/products-service";

// Create audiobook chapters with book details
export const createAudiobookChapterService = async (bookDetails: any, chapters: any, res: Response) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const savedBook = await createBookService(bookDetails, res);
    if (!savedBook?.data?._id) {
      return errorResponseHandler("Book creation failed", httpStatusCode.NOT_FOUND, res);
    }

    const chaptersWithBookId = chapters.map((chapter: any) => ({
      ...chapter,
      productId: savedBook.data._id,
    }));

    const savedAudiobookChapters = await audiobookChaptersModel.insertMany(chaptersWithBookId, { session });

    await session.commitTransaction();
    session.endSession();

    return {
      success: true,
      message: "Audiobook chapters created successfully",
      data: savedAudiobookChapters,
    };
  } catch (error: any) {
    await session.abortTransaction();
    session.endSession();

    return res.status(500).json({
      success: false,
      message: "Failed to create audiobook chapters",
      error: error.message,
    });
  }
};

// Get audiobook chapter by ID
export const getAudiobookChapterByIdService = async (id: string, res: Response) => {
  try {
    const chapter = await audiobookChaptersModel.findById(id).populate('productId');
    if (!chapter) {
      return errorResponseHandler("Audiobook chapter not found", httpStatusCode.NOT_FOUND, res);
    }
    return {
      success: true,
      message: "Audiobook chapter retrieved successfully",
      data: chapter,
    };
  } catch (error: any) {
    return errorResponseHandler("Failed to retrieve audiobook chapter", httpStatusCode.INTERNAL_SERVER_ERROR, res);
  }
};

// Get all audiobook chapters for a specific product
export const getAudiobookChaptersByProductIdService = async (payload: any, productId: string) => {
  const page = parseInt(payload.page as string) || 1;
  const limit = parseInt(payload.limit as string) || 0;
  const offset = (page - 1) * limit;

  const productData = await productsModel.findById(productId);
  const totalDataCount = await audiobookChaptersModel.countDocuments({ productId: productId });
  const chapters = await audiobookChaptersModel.find({ productId: productId })
    .sort({ srNo: 1 })
    .skip(offset)
    .limit(limit)
    .select("-__v")
    .populate('productId');

  if (chapters.length > 0) {
    return {
      success: true,
      message: "Audiobook chapters retrieved successfully",
      page,
      limit,
      total: totalDataCount,
      data: { productData, chapters },
    };
  } else {
    return {
      success: true,
      message: "No chapters present for this audiobook",
      data: { productData },
    };
  }
};

// Get all audiobook chapters
export const getAllAudiobookChaptersService = async (payload: any) => {
  const page = parseInt(payload.page as string) || 1;
  const limit = parseInt(payload.limit as string) || 0;
  const offset = (page - 1) * limit;
  const { query, sort } = queryBuilder(payload, ["name"]);

  const totalDataCount = Object.keys(query).length < 1 ? await audiobookChaptersModel.countDocuments() : await audiobookChaptersModel.countDocuments(query);
  const results = await audiobookChaptersModel.find(query)
    .sort({ srNo: 1, ...sort })
    .skip(offset)
    .limit(limit)
    .select("-__v")
    .populate('productId');

  if (results.length) {
    return {
      page,
      limit,
      success: true,
      message: "Audiobook chapters retrieved successfully",
      total: totalDataCount,
      data: results,
    };
  } else {
    return {
      data: [],
      page,
      limit,
      success: false,
      message: "No audiobook chapters found",
      total: 0,
    };
  }
};

// Update audiobook chapter
export const updateAudiobookChapterService = async (id: string, payload: any, res: Response) => {
  try {
    const updatedChapter = await audiobookChaptersModel.findByIdAndUpdate(id, payload, {
      new: true,
    });
    if (!updatedChapter) {
      return errorResponseHandler("Audiobook chapter not found", httpStatusCode.NOT_FOUND, res);
    }
    return {
      success: true,
      message: "Audiobook chapter updated successfully",
      data: updatedChapter,
    };
  } catch (error: any) {
    return errorResponseHandler("Failed to update audiobook chapter", httpStatusCode.INTERNAL_SERVER_ERROR, res);
  }
};

// Delete audiobook chapter
export const deleteAudiobookChapterService = async (id: string, res: Response) => {
  try {
    const deletedChapter = await audiobookChaptersModel.findByIdAndDelete(id);
    if (!deletedChapter) {
      return errorResponseHandler("Audiobook chapter not found", httpStatusCode.NOT_FOUND, res);
    }

    // Delete the file from S3 if it exists
    if (deletedChapter.file) {
      await deleteFileFromS3(deletedChapter.file);
    }

    return {
      success: true,
      message: "Audiobook chapter deleted successfully",
      data: deletedChapter,
    };
  } catch (error: any) {
    return errorResponseHandler("Failed to delete audiobook chapter", httpStatusCode.INTERNAL_SERVER_ERROR, res);
  }
};
// Delete multiple audiobook chapters by product ID
export const deleteAudiobookChaptersByProductIdService = async (productId: string, res: Response) => {
  try {
    const chapters = await audiobookChaptersModel.find({ productId: productId });
    if (!chapters.length) {
      return errorResponseHandler("No audiobook chapters found for this product", httpStatusCode.NOT_FOUND, res);
    }

    // Delete all files from S3
    for (const chapter of chapters) {
      if (chapter.file) {
        await deleteFileFromS3(chapter.file);
      }
    }

    // Delete all chapters from database
    await audiobookChaptersModel.deleteMany({ productId: productId });

    return {
      success: true,
      message: "All audiobook chapters deleted successfully",
      data: { deletedCount: chapters.length },
    };
  } catch (error: any) {
    return errorResponseHandler("Failed to delete audiobook chapters", httpStatusCode.INTERNAL_SERVER_ERROR, res);
  }
};

// Update multiple audiobook chapters
export const updateMultipleAudiobookChaptersService = async (chapters: any | any[]) => {
  const chaptersArray = Array.isArray(chapters) ? chapters : [chapters];

  if (!chaptersArray.length) {
    throw new Error("No chapters provided for update or creation.");
  }

  const chaptersToUpdate = chaptersArray.filter((chapter) => chapter._id);
  const chaptersToCreate = chaptersArray.filter((chapter) => !chapter._id);

  const bulkOperations = chaptersToUpdate.map((chapter) => ({
    updateOne: {
      filter: { _id: chapter._id },
      update: { $set: chapter },
    },
  }));

  let updateResult = { modifiedCount: 0 };
  if (bulkOperations.length > 0) {
    updateResult = await audiobookChaptersModel.bulkWrite(bulkOperations);
  }

  let createdChapters: any = [];
  if (chaptersToCreate.length > 0) {
    createdChapters = await audiobookChaptersModel.insertMany(chaptersToCreate);
  }

  return {
    success: true,
    message: `${updateResult.modifiedCount} audiobook chapter(s) updated, ${createdChapters.length} new chapter(s) created successfully`,
    updatedCount: updateResult.modifiedCount,
    createdCount: createdChapters.length,
    createdChapters,
  };
};
