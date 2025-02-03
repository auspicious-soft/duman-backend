import { Response } from "express";
import { errorResponseHandler } from "../../lib/errors/error-response-handler";
import { httpStatusCode } from "../../lib/constant";
import { queryBuilder } from "src/utils";
import { bookSchoolsModel } from "../../models/book-schools/book-schools-schema";
import { PipelineStage } from "mongoose";
import { productsModel } from "src/models/products/products-schema";
import { usersModel } from "src/models/user/user-schema";

export const createBookSchoolService = async (payload: any, res: Response) => {
  const newBookSchool = new bookSchoolsModel(payload);
  const savedBookSchool = await newBookSchool.save();
  return {
    success: true,
    message: "Book school created successfully",
    data: savedBookSchool,
  };
};

export const getBookSchoolService = async (payload:any, id: string, res: Response) => {
  const page = parseInt(payload.page as string) || 1;
  const limit = parseInt(payload.limit as string) || 0;
  const offset = (page - 1) * limit;
  const { query, sort } = queryBuilder(payload,["name","couponCode"]);

  const bookSchool = await bookSchoolsModel.findById(id).populate('publisherId');
  if (!bookSchool) return errorResponseHandler("Book school not found", httpStatusCode.NOT_FOUND, res);
  const totalDataCount = Object.keys(query).length < 1 ? await productsModel.countDocuments() : await productsModel.countDocuments(query);
    const results = await productsModel.find({
      publisherId: {$in :bookSchool?.publisherId},type:"e-book",...query
    }).sort(sort).skip(offset).limit(limit).select("-__v").populate([
        { path: "publisherId" }, 
        { path: "authorId" }, 
        { path: "categoryId" }, 
        { path: "subCategoryId" }, 
    ]);
  
  if (results.length)
    return {
      page,
      limit,
      success: true,
      total: totalDataCount,
      data: {bookSchool,results},
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

export const getAllBookSchoolsService = async (payload: any, res: Response) => {
    const page = parseInt(payload.page as string) || 1;
    const limit = parseInt(payload.limit as string) || 0;
    const offset = (page - 1) * limit;
    const { query, sort } = queryBuilder(payload,["name","couponCode"]);
  
    const totalDataCount = Object.keys(query).length < 1 ? await bookSchoolsModel.countDocuments() : await bookSchoolsModel.countDocuments(query);
    const results = await bookSchoolsModel.find(query).sort(sort).skip(offset).limit(limit).select("-__v").populate([
        { path: "publisherId" }, 
    ]);
    
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
export const getBookSchoolsByCodeService = async (payload: any, res: Response) => {
    const page = parseInt(payload.page as string) || 1;
    const limit = parseInt(payload.limit as string) || 0;
    const offset = (page - 1) * limit;
    const { query, sort } = queryBuilder(payload,["couponCode"]);
  
    const totalDataCount = Object.keys(query).length < 1 ? await bookSchoolsModel.countDocuments() : await bookSchoolsModel.countDocuments(query);
    const results = await bookSchoolsModel.find(query).sort(sort).skip(offset).limit(limit).select("-__v").populate([
        { path: "publisherId" }, 
    ]);
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
export const verifyBookSchoolsByCodeService = async (payload: any, res: Response) => {
    const { query } = queryBuilder(payload,["couponCode"]);
    const page = parseInt(payload.page as string) || 1;
    const limit = parseInt(payload.limit as string) || 0;
    const offset = (page - 1) * limit;
    const totalDataCount = Object.keys(query).length < 1 ? await bookSchoolsModel.countDocuments() : await bookSchoolsModel.countDocuments(query);
    const bookSchool = await bookSchoolsModel.find({couponCode:payload.couponCode}).populate([
      { path: "publisherId" }, 
    ]);
    console.log('bookSchool: ', bookSchool.map(school => school._id));
    const bookSchoolId = bookSchool.map(school => school._id);
    const user = await usersModel.findOne({email:"mansi.bhandari150@gmail.com"});
    
    if (user && user.schoolVoucher) {
      user.schoolVoucher.voucherId = bookSchoolId[0];
      await user.save();
    }
    const publisherIds = bookSchool.flatMap(school => 
      school.publisherId.map(publisher => publisher._id)
    );

    const results = await productsModel.find({
      publisherId: {$in :publisherIds},type:"e-book",...query
    }).skip(offset).limit(limit).select("-__v").populate([
      { path: "publisherId" }, 
      { path: "authorId" }, 
      { path: "categoryId" }, 
      { path: "subCategoryId" }, 
    ]);
    if (results.length)
      return {
        success: true,
        total: totalDataCount,
        data: results,
      };
    else {
      return {
        data: [],
        success: false,
        total: 0,
      };
    }
  };

export const updateBookSchoolService = async (id: string, payload: any, res: Response) => {
  const updatedBookSchool = await bookSchoolsModel.findByIdAndUpdate(id, payload, {
    new: true,
  });
  if (!updatedBookSchool) return errorResponseHandler("Book school not found", httpStatusCode.NOT_FOUND, res);
  
  return {    
    success: true,
    message: "Book school updated successfully",
    data: updatedBookSchool,
  };
};

export const deleteBookSchoolService = async (id: string, res: Response) => {
  const deletedBookSchool = await bookSchoolsModel.findByIdAndDelete(id);
  if (!deletedBookSchool) return errorResponseHandler("Book school not found", httpStatusCode.NOT_FOUND, res);
  
  return {
    success: true,
    message: "Book school deleted successfully",
    data: deletedBookSchool,
  };
};
