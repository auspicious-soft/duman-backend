import { Response } from "express";
import { errorResponseHandler } from "../../lib/errors/error-response-handler";
import { httpStatusCode } from "../../lib/constant";

import { nestedQueryBuilder, queryBuilder } from "src/utils";
import { publishersModel } from "../../models/publishers/publishers-schema";
import { productsModel } from "src/models/products/products-schema";
import { deleteFileFromS3 } from "src/config/s3";
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
  const { query } = nestedQueryBuilder(payload, ["name"]);
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
    const { query, sort } = nestedQueryBuilder(payload, ["name"]) as { query: any; sort: any };

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

// export const publisherDashboardService = async (payload: any, currentUser: string, res: Response) => {
//   try {
//     const publisherId = currentUser;
//     console.log('publisherId: ', publisherId);
//     const selectedYear = payload?.year ? parseInt(payload?.year as string, 10) : new Date().getFullYear();
//     console.log('selectedYear: ', selectedYear);
//     const currentYear = new Date().getFullYear();
//     const currentMonth = new Date().getMonth() + 1; // January = 0, so add 1

//     // Step 1: Fetch orders and populate productIds
//     const orders = await ordersModel.find({
//       createdAt: {
//         $gte: new Date(`${selectedYear}-01-01`), // Start of the selected year
//         $lt: new Date(`${selectedYear + 1}-01-01`), // Start of the next year
//       },
//     }).populate('productIds'); // Populate product details

//     // Step 2: Extract books with matching publisherId
//     const books = orders
//       .flatMap(order => order.productIds) // Flatten the productIds from all orders
//       .filter((book: any) => book?.publisherId?.toString() === publisherId); // Filter by publisherId

//     // Step 3: Count orders and books
//     const uniqueBooks = Array.from(new Set(books.map(book => book._id.toString()))); // Ensure unique books
//     const totalBooks = uniqueBooks.length;

//     const monthlyCounts = await ordersModel.aggregate([
//       {
//         $match: {
//           "productIds.publisherId": new mongoose.Types.ObjectId(publisherId), // Match by publisherId in populated products
//           createdAt: {
//             $gte: new Date(`${selectedYear}-01-01`),
//             $lt: new Date(`${selectedYear + 1}-01-01`),
//           },
//         },
//       },
//       {
//         $group: {
//           _id: { $month: "$createdAt" },
//           count: { $sum: 1 },
//         },
//       },
//       { $sort: { _id: 1 } },
//     ]);

//     const monthlyCountArray = monthlyCounts.map(({ _id, count }) => {
//       const month = new Date(selectedYear, _id - 1); // _id is the month (1 = January)
//       const formattedMonth = month.toLocaleString("default", { year: "numeric", month: "2-digit" });
//       return { month: formattedMonth, count };
//     });

//     // Step 4: Return the data
//     return {
//       totalBooks,
//       analytics: {
//         monthlyCounts: monthlyCountArray,
//       },
//     };
//   } catch (error) {
//     console.error("Error in publisherDashboardService:", error);
//     throw new Error("Failed to fetch publisher dashboard data");
//   }
// };


export const publisherDashboardService = async (payload: any, currentUser: string, res: Response) => {
  try {
    const publisherId = new mongoose.Types.ObjectId(currentUser); // Convert to ObjectId
    const selectedYear = payload?.year ? parseInt(payload.year as string, 10) : new Date().getFullYear();
    const currentYear = new Date().getFullYear();
    let overviewDate: Date | null = new Date();
    overviewDate.setDate(new Date().getDate() - 30);

    const Books =  await productsModel.find({ publisherId }).populate([{path:'authorId',select:"name"}])
    const NewBooks = await productsModel.find( { publisherId,createdAt: { $gte: overviewDate } } ).countDocuments();
    const TotalBooksCount =  Books.length;
    
    const averageRating: number = Books.reduce((acc: number, rating: any) => acc + (rating.averageRating || 0), 0) / Books.length;

    // // **1. Fetch Orders and Populate `productIds` (Books)**
    const orders = await ordersModel
    .find()
    .populate({
      path: "productIds",
      model: "products", // Ensure this matches your Mongoose model name
    });
    
    console.log('orders: ', orders);
    let bookCounts: Record<string, number> = {};
    // // **2. Extract and Filter Books for the Given Publisher**
    orders.forEach((order) => {
      order.productIds.forEach((book: any) => {
        if (book.publisherId?.toString() === publisherId.toString()) {
          const bookId = book._id.toString();
          if (!bookCounts[bookId]) {
            bookCounts[bookId] = 0;
          }
          bookCounts[bookId] += 1;
        }
      });
    });
    const sortedBookIds = Object.entries(bookCounts)
  .sort(([, countA], [, countB]) => countB - countA) 
  .slice(0, 4) 
  .map(([bookId]) => new mongoose.Types.ObjectId(bookId));
  const topBooks = await productsModel.find({ _id: { $in: sortedBookIds } }).populate([{
    path:"authorId",
    select:"name"
  }]);
    // **3. Get Unique Books and Count**
    // const uniqueBooks: string[] = Array.from(new Set(books.map((book: any) => book._id.toString())));
    // const totalBooks = uniqueBooks.length;

    // **4. Compute Monthly Order Statistics**
    const monthlyCounts = await ordersModel.aggregate([
      {
        $match: {
          createdAt: {
            $gte: new Date(`${selectedYear}-01-01`),
            $lt: new Date(`${selectedYear + 1}-01-01`),
          },
        },
      },
      { $unwind: "$productIds" }, // Unwind the array to process each book separately
      {
        $lookup: {
          from: "products", // Ensure this matches your MongoDB collection name
          localField: "productIds",
          foreignField: "_id",
          as: "bookDetails",
        },
      },
      { $unwind: "$bookDetails" }, // Extract book details
      {
        $match: {
          "bookDetails.publisherId": publisherId,
        },
      },
      {
        $group: {
          _id: { $month: "$createdAt" },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // **5. Convert Monthly Aggregation to Proper Format**
    const monthlyCountArray = monthlyCounts.map(({ _id, count }) => {
      const month = new Date(selectedYear, _id - 1); // _id is the month, 1 = January
      const formattedMonth = month.toLocaleString("default", { year: "numeric", month: "2-digit" }); // Format as "YYYY-MM"
      return {
        month: formattedMonth,
        count,
      };
    });

    // **6. Return the Data**
    return {
      TotalBooksCount,
      NewBooks,
      averageRating,
      topBooks,
      analytics: {
        monthlyCounts: monthlyCountArray,
      },
      Books
    };
  } catch (error) {
    console.error("Error in publisherDashboardService:", error);
    throw new Error("Failed to fetch publisher dashboard data");
  }
};