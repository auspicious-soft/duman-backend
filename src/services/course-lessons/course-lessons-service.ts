import { courseLessonsModel } from "../../models/course-lessons/course-lessons-schema";
import { queryBuilder } from "src/utils";
import { errorResponseHandler } from "src/lib/errors/error-response-handler";
import { httpStatusCode } from "src/lib/constant";
import { deleteFileFromS3 } from "src/config/s3";
import { Response } from "express";
import { createBookService } from "../products/products-service";
import mongoose from "mongoose";
import { productsModel } from "src/models/products/products-schema";

export const createCourseLessonService = async (bookDetails: any, lessons: any, res: Response) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const savedBook = await createBookService(bookDetails, res);
    if (!savedBook?.data?._id) {
      return errorResponseHandler("Book creation failed", httpStatusCode.NOT_FOUND, res);
    }

    const lessonsWithBookId = lessons.map((lesson: any) => ({
      ...lesson,
      productId: savedBook.data._id,
      // type: lesson.type || "course",
    }));

    const savedCourseLessons = await courseLessonsModel.insertMany(lessonsWithBookId, { session });

    await session.commitTransaction();
    session.endSession();

    return {
      success: true,
      message: "Course lessons created successfully",
      data: savedCourseLessons,
    };
  } catch (error: any) {
    await session.abortTransaction();
    session.endSession();

    return res.status(500).json({
      success: false,
      message: "Failed to create course lessons",
      error: error.message,
    });
  }
};

export const getCourseLessonByIdService = async (payload: any, productId: string) => {
  const page = parseInt(payload.page as string) || 1;
  const limit = parseInt(payload.limit as string) || 0;
  const offset = (page - 1) * limit;
  const courseData = await productsModel.findById(productId);
  const totalDataCount = Object.keys({ productId: productId }).length < 1 ? await courseLessonsModel.countDocuments() : await courseLessonsModel.countDocuments({ productId: productId });
  const lessons = await courseLessonsModel.find({ productId: productId }).skip(offset).limit(limit).select("-__v");
  if (lessons.length > 0) {
    return {
      success: true,
      message: "Course lessons retrieved successfully",
      page,
      limit,
      total: totalDataCount,
      data: { courseData, lessons },
    };
  } else {
    return {
      success: true,
      message: "No lessons present for this course",
      data: { courseData },
    };
  }
};


export const updateCourseLessons = async (lessons: any | any[]) => {
  console.log('lessons: ', lessons);
  const lessonsArray = Array.isArray(lessons) ? lessons : [lessons];

  if (!lessonsArray.length) {
    throw new Error("No lessons provided for update or creation.");
  }

  const lessonsToUpdate = lessonsArray.filter((lesson) => lesson._id);
  const lessonsToCreate = lessonsArray.filter((lesson) => !lesson._id);

  const bulkOperations = lessonsToUpdate.map((lesson) => ({
    updateOne: {
      filter: { _id: lesson._id },
      update: { $set: lesson },
    },
  }));

  let updateResult = { modifiedCount: 0 };
  if (bulkOperations.length > 0) {
    updateResult = await courseLessonsModel.bulkWrite(bulkOperations);
  }

  let createdLessons:any = [];
  if (lessonsToCreate.length > 0) {
    createdLessons = await courseLessonsModel.insertMany(lessonsToCreate);
  }

  return {
    success: true,
    message: `${updateResult.modifiedCount} course lesson(s) updated, ${createdLessons.length} new lesson(s) created successfully`,
    updatedCount: updateResult.modifiedCount,
    createdCount: createdLessons.length,
    createdLessons,
  };
};


export const deleteCourseLessonService = async (courseLessonId: string, res: Response) => {
  const deletedCourseLesson: any = await courseLessonsModel.findByIdAndDelete(courseLessonId);
  if (!deletedCourseLesson) return errorResponseHandler("Course lesson not found", httpStatusCode.NOT_FOUND, res);

  const fileKeys = deletedCourseLesson.sections?.map((section: any) => section.file) || [];

  for (const filePath of fileKeys) {
    if (filePath) {
      await deleteFileFromS3(filePath);
    }
  }
  return {
    success: true,
    message: "Course lesson deleted successfully",
    data: deletedCourseLesson,
  };
};

export const getAllCourseLessons = async (payload: any) => {
  const page = parseInt(payload.page as string) || 1;
  const limit = parseInt(payload.limit as string) || 0;
  const offset = (page - 1) * limit;
  const { query, sort } = queryBuilder(payload, ["lessonTitle"]);

  const totalDataCount = Object.keys(query).length < 1 ? await courseLessonsModel.countDocuments() : await courseLessonsModel.countDocuments(query);
  const results = await courseLessonsModel.find(query).sort(sort).skip(offset).limit(limit).select("-__v");
  if (results.length)
    return {
      page,
      limit,
      success: true,
      message: "Course lessons retrieved successfully",
      total: totalDataCount,
      data: results,
    };
  else {
    return {
      data: [],
      page,
      limit,
      success: false,
      message: "No course lessons found",
      total: 0,
    };
  }
};
