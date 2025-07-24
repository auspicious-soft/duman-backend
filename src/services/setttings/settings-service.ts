import { httpStatusCode } from "../../lib/constant";
import { errorParser, errorResponseHandler } from "../../lib/errors/error-response-handler";
import { settingModel } from "../../models/settings/settings-schema";
import { Request, Response } from "express";

export const createUpdateSettings = async (
  payload: any,
  res: Response
) => {
    const { ...updateFields } = payload;

    const checkExist = await settingModel.findOne({ isActive: true });
    let result;

    if (checkExist) {
      // Update existing settings
      result = await settingModel.findByIdAndUpdate(
        checkExist._id,
        updateFields,
        { new: true, runValidators: true }
      );

      if (!result) {
        // return errorResponseHandler(
        //   "Admin settings not found",
        //   httpStatusCode.NOT_FOUND,
        //   res
        // );
        result:[]
      }
    } else {
      // Create new settings
      result = await settingModel.create(updateFields);
    }

    return {
      success: true,
      message: checkExist
        ? "Admin settings updated successfully"
        : "Admin settings created successfully",
      data: result,
    };
  
};

export const getSettingsService = async (payload:any, res: Response) => {
    const settings = await settingModel.findOne();
    let policy;
    let message;
    if (!settings) {
      // return errorResponseHandler(
      //   "Admin settings not found",
      //   httpStatusCode.NOT_FOUND,
      //   res
      // );
      return {
      success: true,
      message: `Settings retrieved successfully`,
      data: policy,
    };
    }
    if(payload.type === "aboutUs"){
      policy = settings.aboutUs
      message = "About Us"
    }
    else if(payload.type === "privacyPolicy"){
      policy = settings.privacyPolicy
      message = "Privacy Policy"
    }
    else if(payload.type === "terms"){
      policy = settings.termsAndConditions
      message = "Terms and Conditions"
    }
    else{
     policy = null
    }
    return {
      success: true,
      message: `${message} retrieved successfully`,
      data: policy,
    };
 
};
