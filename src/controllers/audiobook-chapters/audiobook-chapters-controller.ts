import { Request, Response } from "express";
import { httpStatusCode } from "src/lib/constant";
import { errorParser } from "src/lib/errors/error-response-handler";
import {
  createAudiobookChapterService,
  getAudiobookChapterByIdService,
  getAudiobookChaptersByProductIdService,
  getAllAudiobookChaptersService,
  updateAudiobookChapterService,
  deleteAudiobookChapterService,
  deleteAudiobookChaptersByProductIdService,
  updateMultipleAudiobookChaptersService,
} from "src/services/audiobook-chapters/audiobook-chapters-service";

// Create audiobook chapters with book details
export const createAudiobookChapter = async (req: Request, res: Response) => {
  try {
    const { bookDetails, chapters } = req.body;
    const response = await createAudiobookChapterService(bookDetails, chapters);
    return res.status(httpStatusCode.CREATED).json(response);
  } catch (error: any) {
    const { code, message } = errorParser(error);
    return res.status(code || httpStatusCode.INTERNAL_SERVER_ERROR).json({ success: false, message: message || "An error occurred" });
  }
};

// Get audiobook chapter by ID
export const getAudiobookChapter = async (req: Request, res: Response) => {
  try {
    const response = await getAudiobookChapterByIdService(req.params.id, res);
    return res.status(httpStatusCode.OK).json(response);
  } catch (error: any) {
    const { code, message } = errorParser(error);
    return res.status(code || httpStatusCode.INTERNAL_SERVER_ERROR).json({ success: false, message: message || "An error occurred" });
  }
};

// Get all audiobook chapters for a specific product
export const getAudiobookChaptersByProductId = async (req: Request, res: Response) => {
  try {
    const response = await getAudiobookChaptersByProductIdService(req.query, req.params.productId);
    return res.status(httpStatusCode.OK).json(response);
  } catch (error: any) {
    const { code, message } = errorParser(error);
    return res.status(code || httpStatusCode.INTERNAL_SERVER_ERROR).json({ success: false, message: message || "An error occurred" });
  }
};

// Get all audiobook chapters
export const getAllAudiobookChapters = async (req: Request, res: Response) => {
  try {
    const response = await getAllAudiobookChaptersService(req.query);
    return res.status(httpStatusCode.OK).json(response);
  } catch (error: any) {
    const { code, message } = errorParser(error);
    return res.status(code || httpStatusCode.INTERNAL_SERVER_ERROR).json({ success: false, message: message || "An error occurred" });
  }
};

// Update audiobook chapter
export const updateAudiobookChapter = async (req: Request, res: Response) => {
  try {
    const response = await updateAudiobookChapterService(req.params.id, req.body, res);
    return res.status(httpStatusCode.OK).json(response);
  } catch (error: any) {
    const { code, message } = errorParser(error);
    return res.status(code || httpStatusCode.INTERNAL_SERVER_ERROR).json({ success: false, message: message || "An error occurred" });
  }
};

// Delete audiobook chapter
export const deleteAudiobookChapter = async (req: Request, res: Response) => {
  try {
    const response = await deleteAudiobookChapterService(req.params.id, res);
    return res.status(httpStatusCode.OK).json(response);
  } catch (error: any) {
    const { code, message } = errorParser(error);
    return res.status(code || httpStatusCode.INTERNAL_SERVER_ERROR).json({ success: false, message: message || "An error occurred" });
  }
};

// Delete all audiobook chapters for a specific product
export const deleteAudiobookChaptersByProductId = async (req: Request, res: Response) => {
  try {
    const response = await deleteAudiobookChaptersByProductIdService(req.params.productId, res);
    return res.status(httpStatusCode.OK).json(response);
  } catch (error: any) {
    const { code, message } = errorParser(error);
    return res.status(code || httpStatusCode.INTERNAL_SERVER_ERROR).json({ success: false, message: message || "An error occurred" });
  }
};

// Update multiple audiobook chapters
export const updateMultipleAudiobookChapters = async (req: Request, res: Response) => {
  try {
    const { chapters } = req.body;
    if (!chapters) {
      return res.status(httpStatusCode.BAD_REQUEST).json({
        success: false,
        message: "No chapters provided for update"
      });
    }

    const response = await updateMultipleAudiobookChaptersService(chapters);
    return res.status(httpStatusCode.OK).json(response);
  } catch (error: any) {
    const { code, message } = errorParser(error);
    return res.status(code || httpStatusCode.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: message || "Failed to update audiobook chapters"
    });
  }
};
