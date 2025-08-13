import { audiobookChaptersModel } from "../../models/audiobook-chapters/audiobook-chapters-schema";
import { queryBuilder } from "src/utils";
import { errorResponseHandler } from "src/lib/errors/error-response-handler";
import { httpStatusCode } from "src/lib/constant";
import { deleteFileFromS3 } from "src/config/s3";
import { Response } from "express";
import { productsModel } from "src/models/products/products-schema";
import mongoose from "mongoose";
import { createBookService } from "../products/products-service";
import { usersModel } from "src/models/user/user-schema";
import { productRatingsModel } from "src/models/ratings/ratings-schema";
import { readProgressModel } from "src/models/user-reads/read-progress-schema";
import { favoritesModel } from "src/models/product-favorites/product-favorites-schema";
import { ordersModel } from "src/models/orders/orders-schema";
import { cartModel } from "src/models/cart/cart-schema";

// Create audiobook chapters with book details
export const createAudiobookChapterService = async (bookDetails: any, chapters: any) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const savedBook = await createBookService(bookDetails, {} as Response);
    if (!savedBook?.data?._id) {
      throw new Error("Book creation failed");
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

    throw new Error(`Failed to create audiobook chapters: ${error.message}`);
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
// export const getAudiobookChapterByIdService = async (user: any, payload: any, productId: string) => {
//   const page = parseInt(payload.page as string) || 1;
//   const limit = parseInt(payload.limit as string) || 0;
//   const offset = (page - 1) * limit;
//   const { lang: language } = payload;

//   // Fetch user data and course
//   const userData = await usersModel.findById(user.id).lean();
//   const course = await productsModel.findById(productId).lean();

//   const availableLanguages = ["eng", "kaz", "rus"];
//   let courseLessons;
//   const reviewCount = await productRatingsModel.countDocuments({ productId: productId });
//   const readProgress = await readProgressModel.findOne({ userId: user.id, bookId: productId });

//   courseLessons = await audiobookChaptersModel.find({ productId: productId, lang: language }).sort({ srNo: 1 }).lean();
//   const courseReadProgress = await readProgressModel.findOne({ bookId: productId, userId: user.id }).lean();

//   if (courseLessons.length === 0 && course?.name) {
//     const languagesToCheck = [payload?.lang, "eng", ...availableLanguages].filter((lang, index, self) => self.indexOf(lang) === index);
//     for (let lang of languagesToCheck) {
//       courseLessons = await audiobookChaptersModel.find({ productId: productId, lang: lang }).sort({ srNo: 1 }).lean();
//       if (courseLessons.length > 0) break;
//     }
//   }

//   const isFavorite = await favoritesModel.exists({ userId: user.id, productId: productId });
//   const isPurchased = await ordersModel.find({ productIds: { $in: productId }, userId: user.id, status: "Completed" }).lean();
//   const isAddedToCart = await cartModel.find({ productId: { $in: [productId] }, userId: user.id, buyed: "pending" }).lean();

//   if (courseLessons.length === 0) {
//     return {
//       success: false,
//       message: "No lessons found for this course in any of the available languages",
//       data: [],
//     };
//   }

//   // Convert read section IDs into a Set for quick lookup
//   const readSectionIds = new Set(courseReadProgress?.readAudioChapter?.map((subLessons: any) => subLessons.audioChapterId.toString()) || []);

//   courseLessons = courseLessons.map((lesson, index, lessons) => {
//     let isOpen = false;
//     if (lesson.srNo === 1) {
//       isOpen = true; // First lesson is always open
//     } else if (index > 0) {
//       const prevLesson = lessons[index - 1];
//       // Check if all sub-lessons in the previous lesson are either in readSections or have file === null
//       isOpen = Array.isArray(prevLesson) && prevLesson.every((subLesson) => subLesson.file === null || courseReadProgress?.readSections?.some((section) => section?.audioChapterId?.toString() === subLesson._id.toString()));
//     }
//     return {
//       ...lesson,
//       isOpen,
//       // subLessons: lesson.map((subLessons) => ({
//       //   ...subLessons,
//         // isDone: readSectionIds.has(subLessons._id.toString()),
//       // })),
//     };
//   });

//   // Check if all lessons and sublessons are completed for certificate availability
//   const certificateAvailable = courseLessons.every((lesson) => lesson.subLessons.every((subLesson) => subLesson.isDone));

//   return {
//     success: true,
//     message: "Lessons retrieved successfully",
//     data: {
//       courseCompleted: readProgress?.isCompleted || false,
//       courseLessons,
//       reviewCount,
//       isFavorite: !!isFavorite,
//       isPurchased: isPurchased.length > 0,
//       isAddedToCart: isAddedToCart.length > 0,
//       certificateAvailable,
//     },
//   };
// };
// Get all audiobook chapters for a specific product
export const getAudiobookChaptersByProductIdForAdminService = async (payload: any, productId: string) => {
  const page = parseInt(payload.page as string) || 1;
  const limit = parseInt(payload.limit as string) || 0;
  const offset = (page - 1) * limit;
  let query: { [key: string]: any } = {};
  if (payload.lang) {
    query.lang = payload.lang;
  }
  const productData = await productsModel.findById(productId);
  const totalDataCount = await audiobookChaptersModel.countDocuments({ productId: productId, ...query });
  const chapters = await audiobookChaptersModel.find({ productId: productId, ...query })
    .sort({ srNo: 1 })
    .skip(offset)
    .limit(limit)
    .select("-__v")
    // .populate('productId');

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



export const getAudiobookChaptersByProductIdService = async (user: any, payload: any, productId: string) => {
  console.log('productId: ', productId);
  const page = parseInt(payload.page as string) || 1;
  const limit = parseInt(payload.limit as string) || 0;
  const offset = (page - 1) * limit;

  let query: { [key: string]: any } = {};
  if (payload.lang) {
    query.lang = payload.lang;
  }

  // Get product
  const productData = await productsModel.findById(productId).lean();
  console.log('productData: ', productData);

  // Get read progress for the user and product
  const readProgress = await readProgressModel.findOne({
    userId: user?.id,
    bookId: productId
  }).lean();

  // Create a Set of read audioChapterIds for fast lookup
  const readAudioChapterIds = new Set(
    readProgress?.readAudioChapter?.map(ch => ch.audioChapterId ? ch.audioChapterId.toString() : null).filter(id => id !== null) || []
  );

  // Get total chapters and paginated result
  const totalDataCount = await audiobookChaptersModel.countDocuments({ productId, ...query });

  let chapters = await audiobookChaptersModel.find({ productId, ...query })
    .sort({ srNo: 1 })
    .skip(offset)
    .limit(limit)
    .select("-__v")
    .lean();

  // Enhance each chapter with isDone and isOpen
  chapters = chapters.map((chapter, index, chapterArray) => {
    const isDone = readAudioChapterIds.has(chapter._id.toString());

    let isOpen = false;
    if (chapter.srNo === 1) {
      isOpen = true; // First chapter is always open
    } else if (index > 0) {
      const prevChapter = chapterArray[index - 1];
      const prevChapterDone = readAudioChapterIds.has(prevChapter._id.toString());
      isOpen = prevChapterDone;
    }

    return {
      ...chapter,
      isDone,
      isOpen,
    };
  });

  // Return formatted response
  if (chapters.length > 0) {
    return {
      success: true,
      message: "Audiobook chapters retrieved successfully",
      page,
      limit,
      total: totalDataCount,
      data: {
        productData,
        chapters,
        audiobookCompleted: readProgress?.isCompleted || false,
      },
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
      upsert:true
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
