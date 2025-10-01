import { Request, Response } from 'express';
import { httpStatusCode } from 'src/lib/constant';
import { errorParser } from 'src/lib/errors/error-response-handler';
import { createQuotation, deleteQuotation, getAllQuotations, getAllQuotationsForUser, getQuotationById, updateQuotation } from 'src/services/quotation/quotation-service';

export const createQuotationHandler = async (req: Request, res: Response) => {
   
    try {
      const response = await createQuotation(req.body)
      return res.status(httpStatusCode.CREATED).json(response)
  } catch (error: any) {
      const { code, message } = errorParser(error)
      return res.status(code || httpStatusCode.INTERNAL_SERVER_ERROR).json({ success: false, message: message || "An error occurred" });
  }
};

export const getQuotationByIdHandler = async (req: Request, res: Response) => {
   
    try {
      const response = await getQuotationById(req.params.id);
      return res.status(httpStatusCode.OK).json(response)
  } catch (error: any) {
      const { code, message } = errorParser(error)
      return res.status(code || httpStatusCode.INTERNAL_SERVER_ERROR).json({ success: false, message: message || "An error occurred" });
  }
};

export const updateQuotationHandler = async (req: Request, res: Response) => {
    try {
      const response = await updateQuotation(req.params.id, req.body);
      return res.status(httpStatusCode.OK).json(response)
  } catch (error: any) {
      const { code, message } = errorParser(error)
      return res.status(code || httpStatusCode.INTERNAL_SERVER_ERROR).json({ success: false, message: message || "An error occurred" });
  }
};

export const deleteQuotationHandler = async (req: Request, res: Response) => {
 
    try {
      const response = await deleteQuotation(req.params.id , res);
      return res.status(httpStatusCode.OK).json(response)
  } catch (error: any) {
      const { code, message } = errorParser(error)
      return res.status(code || httpStatusCode.INTERNAL_SERVER_ERROR).json({ success: false, message: message || "An error occurred" });
  }
};

export const getAllQuotationsHandler = async (req: Request, res: Response) => {
    try {
      const response = await getAllQuotations(req.query);
      return res.status(httpStatusCode.OK).json(response)
  } catch (error: any) {
      const { code, message } = errorParser(error)
      return res.status(code || httpStatusCode.INTERNAL_SERVER_ERROR).json({ success: false, message: message || "An error occurred" });
  }
};
export const getAllQuotationsHandlerForUser = async (req: Request, res: Response) => {
    try {
      const response = await getAllQuotationsForUser(req.query);
      return res.status(httpStatusCode.OK).json(response)
  } catch (error: any) {
      const { code, message } = errorParser(error)
      return res.status(code || httpStatusCode.INTERNAL_SERVER_ERROR).json({ success: false, message: message || "An error occurred" });
  }
};
