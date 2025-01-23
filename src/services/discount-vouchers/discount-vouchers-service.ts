import { Response } from "express";
import { errorResponseHandler } from "../../lib/errors/error-response-handler";
import { httpStatusCode } from "../../lib/constant";
import { queryBuilder } from "src/utils";
import { discountVouchersModel } from "../../models/discount-vouchers/discount-vouchers-schema";
import { PipelineStage } from "mongoose";


export const createDiscountVoucherService = async (payload: any, res: Response) => {
  const newVoucher = new discountVouchersModel(payload);
  const savedVoucher = await newVoucher.save();
  return {
    success: true,
    message: "Discount voucher created successfully",
    data: savedVoucher,
  };
};

export const getDiscountVoucherService = async (id: string, res: Response) => {
  const voucher = await discountVouchersModel.findById(id);
  if (!voucher) return errorResponseHandler("Discount voucher not found", httpStatusCode.NOT_FOUND, res);
  return {
    success: true,
    message: "Discount voucher retrieved successfully",
    data: voucher,
  };
};

export const getAllDiscountVouchersService = async (payload: any, res: Response) => {
  const page = parseInt(payload.page as string) || 1;
  const limit = parseInt(payload.limit as string) || 0;
  const offset = (page - 1) * limit;
  const { query, sort } = queryBuilder(payload, ["couponCode", "percentage"]);

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
          from: "orders", // Join with products collection
          localField: "_id", // Field in publishers
          foreignField: "voucherId", // Field in products
          as: "voucher", // Name the joined array
        },
      },
      {
        $addFields: {
          activationCount: { $size: "$voucher" }, // Calculate the count of books
        },
      },
    ];

    // Conditionally add pagination stages
    if (limit > 0) {
      pipeline.push(
        { $skip: offset }, // Apply pagination: skip to the offset
        { $limit: limit } // Apply pagination: limit the number of results
      );
    }

    // Fetch the total number of publishers
    const totalDataCount = await discountVouchersModel.countDocuments(query);

    // Execute the aggregation pipeline
    const results = await discountVouchersModel.aggregate(pipeline);

    return {
      page,
      limit,
      success: true,
      total: totalDataCount,
      data: results.map((voucher) => ({
        voucher,
      })),
    };
  } catch (error: any) {
    console.error("Error in getAllDiscountVouchersService:", error.message);
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

// export const getAllDiscountVouchersService = async (payload: any, res: Response) => {
//   const page = parseInt(payload.page as string) || 1;
//   const limit = parseInt(payload.limit as string) || 0;
//   const offset = (page - 1) * limit;
//   const { query, sort } = queryBuilder(payload, ["couponCode","percentage"]);

//   // const totalDataCount = Object.keys(query).length < 1 ? await discountVouchersModel.countDocuments() : await discountVouchersModel.countDocuments(query);
//   // const results = await discountVouchersModel.find(query).sort(sort).skip(offset).limit(limit).select("-__v");
//   // if (results.length)
//   //   return {
//   //     page,
//   //     limit,
//   //     success: true,
//   //     total: totalDataCount,
//   //     data: results,
//   //   };
//   // else {
//   //   return {
//   //     data: [],
//   //     page,
//   //     limit,
//   //     success: false,
//   //     total: 0,
//   //   };
//   // }


// // const sort: Record<string, 1 | -1> = {};
//   // if (payload.sortField) {
//   //   sort[payload.sortField] = payload.sortOrder === "desc" ? -1 : 1 as 1 | -1;
//   // } else {
//   //   sort["publisherDetails.name"] = -1; // Default sort by publisher name
//   // }
//   if (payload.sortField) {
//     sort[payload.sortField] = payload.sortOrder === "desc" ? -1 : 1 as 1 | -1;
//   } else {
//     sort["publisherDetails.name"] = -1; // Default sort by publisher name
//   }
//   try {
//     // Aggregation pipeline to fetch publishers and book counts
//     const pipeline: PipelineStage[] = [
//       {
//         $match: query, // Filter by search query
//       },
//       {
//         $lookup: {
//           from: "orders", // Join with products collection
//           localField: "_id", // Field in publishers
//           foreignField: "voucherId", // Field in products
//           as: "voucher", // Name the joined array
//         },
//       },
//       {
//         $addFields: {
//           activationCount: { $size: "$voucher" }, // Calculate the count of books
//         },
//       },
//       // {
//       //   $sort: Object.keys(sort).reduce((acc, key) => {
//       //     acc[key] = sort[key] === "asc" ? 1 : -1;
//       //     return acc;
//       //   }, {} as Record<string, 1 | -1>), // Apply sorting
//       // },
//       // {
//       //   $sort: sort, // Apply sorting
//       // },
//       {
//         $skip: offset, // Apply pagination: skip to the offset
//       },
//       {
//         $limit: limit, // Apply pagination: limit the number of results
//       },
//     ];

//     // Fetch the total number of publishers
//     const totalDataCount = await discountVouchersModel.countDocuments();

//     // Execute the aggregation pipeline
//     const results = await discountVouchersModel.aggregate(pipeline);

//     return {
//       page,
//       limit,
//       success: true,
//       total: totalDataCount,
//       data: results.map((voucher) => ({
//         voucher,
        
//       })),
//     }}
//     catch (error: any) {
//       console.error("Error in getAllPublishersService:", error.message);
//       return {
//         page,
//         limit,
//         success: false,
//         total: 0,
//         data: [],
//         error: error.message,
//       };
//     }
//   };


export const updateDiscountVoucherService = async (id: string, payload: any, res: Response) => {
  const updatedVoucher = await discountVouchersModel.findByIdAndUpdate(id, payload, {
    new: true,
  });
  if (!updatedVoucher) return errorResponseHandler("Discount voucher not found", httpStatusCode.NOT_FOUND, res);
  
  return {    
    success: true,
    message: "Discount voucher updated successfully",
    data: updatedVoucher,
  };
};

export const deleteDiscountVoucherService = async (id: string, res: Response) => {
  const deletedVoucher = await discountVouchersModel.findByIdAndDelete(id);
  if (!deletedVoucher) return errorResponseHandler("Discount voucher not found", httpStatusCode.NOT_FOUND, res);
  
  return {
    success: true,
    message: "Discount voucher deleted successfully",
    data: deletedVoucher,
  };
};
