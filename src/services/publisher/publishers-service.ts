import { Response } from "express";
import { errorResponseHandler } from "../../lib/errors/error-response-handler";
import { httpStatusCode } from "../../lib/constant";

import { queryBuilder } from "src/utils";
import { publishersModel } from "../../models/publishers/publishers-schema";
import { productsModel } from "src/models/products/products-schema";
import { deleteFileFromS3 } from "src/configF/s3";
import mongoose, { PipelineStage } from "mongoose";
import { ordersModel } from "src/models/orders/orders-schema"; // Add this import
import moment from "moment"; // Add this import for date manipulation

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

  const booksCount = await productsModel.countDocuments({ publisherId: id });

  return {
    success: true,
    message: "Publisher retrieved successfully",
    data: {
      publisher,
      booksCount,
      publisherBooks,
    },
  };
};

export const getAllPublishersService = async (payload: any, res: Response) => {
  const page = parseInt(payload.page as string) || 1;
  const limit = parseInt(payload.limit as string) || 10; // Default limit
  const offset = (page - 1) * limit;
  const { query } = queryBuilder(payload, ["name"]);
  // Sorting logic
  const sort: Record<string, 1 | -1> = {};
  if (payload.sortField) {
    sort[payload.sortField] = payload.sortOrder === "desc" ? -1 : (1 as 1 | -1);
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

export const getBooksByPublisherService = async (payload: any, req: any, res: Response) => {
  try {
    const page = parseInt(payload.page as string) || 1;
    const limit = parseInt(payload.limit as string) || 0;
    const offset = (page - 1) * limit;
    const { query, sort } = queryBuilder(payload, ["name"]) as { query: any; sort: any };

    if (payload.type) {
      query.type = payload.type;
    }
    // query.publisherId = req.currentUser;

    const totalDataCount = Object.keys(query).length < 1 ? await productsModel.countDocuments() : await productsModel.countDocuments(query);
    const results = await productsModel.find(query).sort(sort).skip(offset).limit(limit).populate("categoryId");
    return {
      success: true,
      message: "Books retrieved successfully",
      total: totalDataCount,
      data: results,
    };
  } catch (error: any) {
    console.error("Error in getBooksByPublisherService:", error.message);
    return {
      success: false,
      message: "Error retrieving books",
      error: error.message,
    };
  }
};


export const getBookByIdPublisherService = async (bookId: string,payload:any,currentUser:any, res: Response) => {
  try {
    // const publisher = currentUser
    const selectedYear = payload?.year ? parseInt(payload?.year as string, 10) : new Date().getFullYear();
    const currentYear =  new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1; // January = 0, so add 1

    // Step 1: Fetch the book details by ID
    const book = await productsModel.findById(bookId);
    if (!book) {
      throw new Error("Book not found");
    }

    // Step 2: Count orders containing this book

    // Count for the current month
    const startOfMonth = new Date(currentYear, currentMonth - 1, 1);
    const endOfMonth = new Date(currentYear, currentMonth, 0); // Last day of current month

    const currentMonthCount = await ordersModel.countDocuments({
      productIds: bookId,
      createdAt: { $gte: startOfMonth, $lt: endOfMonth },
    });

    // Total count (all-time)
    const totalCount = await ordersModel.countDocuments({
      productIds: bookId,
    });

    // Monthly breakdown for the current year

    const monthlyCounts = await ordersModel.aggregate([
      {
        $match: {
          productIds: new mongoose.Types.ObjectId(bookId), // Correct field name
          createdAt: {
            $gte: new Date(`${selectedYear}-01-01`), // Start of the current year
            $lt: new Date(`${selectedYear + 1}-01-01`), // Start of the next year
          },
        },
      },
      {
        $group: {
          _id: { $month: "$createdAt" }, // Group by month
          count: { $sum: 1 }, // Count occurrences
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Correctly transform aggregation result into a 12-month array
    // const monthlyCountArray = Array(12).fill(0); // Initialize array with 12 zeros
    // monthlyCounts.forEach(({ _id, count }) => {
    //   monthlyCountArray[_id - 1] = count; // _id is the month (1 = January, so subtract 1 for index)
    // });

    const monthlyCountArray = monthlyCounts.map(({ _id, count }) => {
      const month = new Date(selectedYear, _id - 1); // _id is the month, 1 = January
      const formattedMonth = month.toLocaleString("default", { year: "numeric", month: "2-digit" }); // Format as "YYYY-MM"
      return {
        month: formattedMonth,
        count,
      };
    });

    // Step 3: Return the combined data
    return {
      book,
      analytics: {
        currentMonthCount,
        totalCount,
        monthlyCounts: monthlyCountArray, // Array with counts for each month
      },
    };
  } catch (error) {
    console.error("Error in getBookByIdPublisherService:", error);
    throw new Error("Failed to fetch book analytics");
  }
};
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
