import { Response } from "express";
import { errorResponseHandler } from "../../lib/errors/error-response-handler";
import { httpStatusCode } from "../../lib/constant";

import { queryBuilder } from "src/utils";
import { publishersModel } from "../../models/publishers/publishers-schema";
import { productsModel } from "src/models/products/products-schema";
import { deleteFileFromS3 } from "src/configF/s3";
import { PipelineStage } from "mongoose";

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
  if (!publisher) return errorResponseHandler("Publisher not found", httpStatusCode.NOT_FOUND, res);
  const publisherBooks = await productsModel.find({ publisherId: id }).populate([{ path: "authorId" }, { path: "categoryId" }, { path: "subCategoryId" }, { path: "publisherId" }]);

  return {
    success: true,
    message: "Publisher retrieved successfully",
    data: publisher,
    publisherBooks,
  };
};


interface QueryBuilderPayload {
  page?: string | number;
  limit?: string | number;
  sortField?: string;
  sortOrder?: "asc" | "desc";
  [key: string]: any;
}

interface PublisherServiceResponse {
  page: number;
  limit: number;
  success: boolean;
  total: number;
  data: any[];
  error?: string;
}

export const getAllPublishersService = async (
  payload: any,
  res: Response
)=> {
  const page = parseInt(payload.page as string) || 1;
  const limit = parseInt(payload.limit as string) || 10; // Default limit
  const offset = (page - 1) * limit;
  const { query } = queryBuilder(payload, ["name"]);
  // Sorting logic
  const sort: Record<string, 1 | -1> = {};
  if (payload.sortField) {
    sort[payload.sortField] = payload.sortOrder === "desc" ? -1 : 1 as 1 | -1;
  } else {
    sort["publisherDetails.name"] = -1; // Default sort by publisher name
  }

  try {
    // Aggregation pipeline to fetch publishers and book counts
    const pipeline: PipelineStage[] = [
      {
        $match: query, // Filter by search query
      },
      {
        $lookup: {
          from: "products", // Join with products collection
          localField: "_id", // Field in publishers
          foreignField: "publisherId", // Field in products
          as: "books", // Name the joined array
        },
      },
      {
        $addFields: {
          bookCount: { $size: "$books" }, // Calculate the count of books
        },
      },
      {
        $sort: Object.keys(sort).reduce((acc, key) => {
          acc[key] = sort[key];
          return acc;
        }, {} as Record<string, 1 | -1>), // Apply sorting
      },
      // {
      //   $sort: sort, // Apply sorting
      // },
      {
        $skip: offset, // Apply pagination: skip to the offset
      },
      {
        $limit: limit, // Apply pagination: limit the number of results
      },
    ];

    // Fetch the total number of publishers
    const totalDataCount = await publishersModel.countDocuments();

    // Execute the aggregation pipeline
    const results = await publishersModel.aggregate(pipeline);

    return {
      page,
      limit,
      success: true,
      total: totalDataCount,
      data: results.map((publisher) => ({
         publisher,
        
      })),
    };
  } catch (error: any) {
    console.error("Error in getAllPublishersService:", error.message);
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


// export const getAllPublishersService = async (payload: any, res: Response) => {
//   const page = parseInt(payload.page as string) || 1;
//   const limit = parseInt(payload.limit as string) || 0;
//   const offset = (page - 1) * limit;
//   const { query, sort } = queryBuilder(payload, ["name"]);

//   const totalDataCount = Object.keys(query).length < 1 ? await publishersModel.countDocuments() : await publishersModel.countDocuments(query);
//   const results = await publishersModel.find(query).sort(sort).skip(offset).limit(limit).populate("categoryId").select("-__v");
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

export const updatePublisherService = async (id: string, payload: any, res: Response) => {
  const updatedPublisher = await publishersModel.findByIdAndUpdate(id, payload, {
    new: true,
  });
  if (!updatedPublisher) return errorResponseHandler("Publisher not found", httpStatusCode.NOT_FOUND, res);
  return {
    success: true,
    message: "Publisher updated successfully",
    data: updatedPublisher,
  };
};

export const deletePublisherService = async (id: string, res: Response) => {
  const deletedPublisher = await publishersModel.findByIdAndDelete(id);
  if (!deletedPublisher) return errorResponseHandler("Publisher not found", httpStatusCode.NOT_FOUND, res);
  if (deletedPublisher?.image) {
    await deleteFileFromS3(deletedPublisher?.image);
  }

  return {
    success: true,
    message: "Publisher deleted successfully",
    data: deletedPublisher,
  };
};
