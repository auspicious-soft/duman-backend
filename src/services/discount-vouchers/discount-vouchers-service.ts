import { Response } from "express";
import { errorResponseHandler } from "../../lib/errors/error-response-handler";
import { httpStatusCode } from "../../lib/constant";
import { queryBuilder } from "src/utils";
import { discountVouchersModel } from "../../models/discount-vouchers/discount-vouchers-schema";


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
  console.log('voucher: ', voucher);
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
  const { query, sort } = queryBuilder(payload, ["couponCode","percentage"]);

  const totalDataCount = Object.keys(query).length < 1 ? await discountVouchersModel.countDocuments() : await discountVouchersModel.countDocuments(query);
  const results = await discountVouchersModel.find(query).sort(sort).skip(offset).limit(limit).select("-__v");
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
