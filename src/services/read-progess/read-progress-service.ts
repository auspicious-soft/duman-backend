import { readProgressModel } from "../../models/read-progress/read-progress-schema";
import { queryBuilder } from "src/utils";
import { errorResponseHandler } from "src/lib/errors/error-response-handler";
import { httpStatusCode } from "src/lib/constant";
import { Response } from "express";

export interface ReadProgress {
  _id?: string;
  userId: string;
  bookId: string;
  progress: number;
}

export const getReadProgressById = async (readProgressId: string, userId: string) => {
  return await readProgressModel.findOne({userId, bookId: readProgressId}).populate([{ path: "bookId" }]);
};

export const updateReadProgress = async (readProgressId: string, readProgressData: ReadProgress, user: any, res: Response) => {
  if (readProgressData.progress < 0 || readProgressData.progress > 100) return errorResponseHandler("Progress must be between 0 and 100", httpStatusCode.BAD_REQUEST, res);
  const userId = user.id;
  const ReadProgress = await readProgressModel
    .findOneAndUpdate({ userId: userId, bookId: readProgressId }, { progress: readProgressData.progress }, { new: true, upsert: true })
    .populate([{ path: "bookId" }]);
  if (!ReadProgress) return errorResponseHandler("Read Progress not found", httpStatusCode.NOT_FOUND, res);
  return {
    success: true,
    message: "Read Progress updated successfully",
    data: ReadProgress,
  };
};


// export const getAllReadProgress = async (payload: any,user:any) => {
//   const page = parseInt(payload.page as string) || 1;
//   const limit = parseInt(payload.limit as string) || 0;
//   const offset = (page - 1) * limit;
//   const { query, sort } = queryBuilder(payload, ["userId", "bookId"]);

//   const totalDataCount = Object.keys(query).length < 1 ? await readProgressModel.countDocuments() : await readProgressModel.countDocuments(query);
//   const results = await readProgressModel
//     .find({userId: user.id, ...query })
//     .sort(sort)
//     .skip(offset)
//     .limit(limit)
//     .select("-__v");
//   if (results.length)
//     return {
//       page,
//       limit,
//       success: true,
//       total: totalDataCount,
//       data: results,
//     };
//   else {
//     return {
//       data: [],
//       page,
//       limit,
//       success: false,
//       total: 0,
//     };
//   }
// };


export const getAllReadProgress = async (payload: any, user: any) => {
  const page = parseInt(payload.page as string) || 1;
  const limit = parseInt(payload.limit as string) || 0;
  const offset = (page - 1) * limit;
  const { query, sort } = queryBuilder(payload, ["userId", "bookId"]);

  // Ensure userId is always in the query
  (query as any).userId = user.id;

  // Filter by type (finished or reading)
  if (payload.type === "finished") {
    (query as any).progress = 100;
  } else if (payload.type === "reading") {
    (query as any).progress = { $lt: 100 };
  }

  const totalDataCount = await readProgressModel.countDocuments(query);

  const results = await readProgressModel
    .find(query)
    .sort(sort)
    .skip(offset)
    .limit(limit)
    .select("-__v");

  return {
    page,
    limit,
    message: "Read Progress retrieved successfully",
    success: results.length > 0,
    total: totalDataCount,
    data: results,
  };
};
