import axios from "axios";
import { configDotenv } from "dotenv";
import { Request, Response } from "express";
import mongoose, { SortOrder } from "mongoose";
import { generateSignedUrlToUploadOn } from "src/config/s3";
import { httpStatusCode } from "src/lib/constant";
import { errorResponseHandler } from "src/lib/errors/error-response-handler";
import { usersModel } from "src/models/user/user-schema";
configDotenv();

const { AWS_REGION, AWS_BUCKET_NAME } = process.env;

export const checkValidAdminRole = (req: Request, res: Response, next: any) => {
  const { role } = req.headers;
  if (role !== "admin") return res.status(403).json({ success: false, message: "Invalid role" });
  else return next();
};
export const checkValidPublisherRole = (req: Request, res: Response, next: any) => {
  const { role } = req.headers;
  if (role !== "publisher") return res.status(403).json({ success: false, message: "Invalid role" });
  else return next();
};

interface Payload {
  description?: string;
  order?: string;
  orderColumn?: string;
}

export const queryBuilder = (payload: Payload, querySearchKeyInBackend = ["name"]) => {
  let { description = "", order = "", orderColumn = "" } = payload;
  const query = description ? { $or: querySearchKeyInBackend.map((key) => ({ [key]: { $regex: description, $options: "i" } })) } : {};
  const sort: { [key: string]: SortOrder } = order && orderColumn ? { [orderColumn]: order === "asc" ? 1 : -1 } : {};

  return { query, sort };
};

export const nestedQueryBuilder = (payload: Payload, querySearchKeyInBackend = ["name"]) => {
  let { description = "", order = "", orderColumn = "" } = payload;

  const queryString = typeof description === "string" ? description : "";

  const query = queryString
    ? {
        $or: querySearchKeyInBackend.flatMap((key) => [
          { [key]: { $regex: queryString, $options: "i" } },
          ...["eng", "kaz", "rus"].map((langKey) => ({
            [`${key}.${langKey}`]: { $regex: queryString, $options: "i" },
          })),
        ]),
      }
    : {};

  const sort: { [key: string]: SortOrder } = order && orderColumn ? { [orderColumn]: order === "asc" ? 1 : -1 } : {};

  return { query, sort };
};

export const toArray = (input: string | string[] | undefined, delimiter: string = ","): string[] => {
  if (!input) return []; // Handle undefined or null input safely
  if (Array.isArray(input)) return input; // If already an array, return as is
  if (typeof input === "string") return input.split(delimiter).map((item) => item.trim()); // Convert comma-separated string to array
  return []; // Fallback case (shouldn't be hit)
};

export const filterBooksByLanguage = (books: any[], languages: string[]): any[] => {
  if (!Array.isArray(books) || books.length === 0) return [];
  if (!Array.isArray(languages) || languages.length === 0) return books; // Return all books if no language filter

  return books.filter((book) => {
    if (book.file instanceof Map) {
      return languages.some((lang) => book.file.has(lang));
    }
    return false;
  });
};

export const sortBooks = (books: any[], sorting: string, languagePriority: string[] = [], language: any = "eng"): any[] => {
  switch (sorting?.toLowerCase()) {
    case "rating":
      return books.sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0));

    //   case "alphabetically":
    //     return books.sort((a, b) => a.name.eng.localeCompare(b.name.eng));
    case "alphabetically":
      return books.sort((a, b) => {
        const nameA = getPrimaryLanguageName(a.name, languagePriority);
        const nameB = getPrimaryLanguageName(b.name, languagePriority);
        return nameA.localeCompare(nameB);
      });

    case "newest":
      return books.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    case "default":
    default:
      return sortByLanguagePriority(books, "file", languagePriority);
  }
};


const getPrimaryLanguageName = (nameObject: Record<string, string>, languagePriority: string[]): string => {
  // Try to get name based on language priority
  for (const lang of languagePriority) {
    if (nameObject[lang]) {
      return nameObject[lang];
    }
  }
  // Fallback: Return the first available name if priority languages are missing
  return Object.values(nameObject)[0] || "Unknown";
};

export const sortByLanguagePriority = <T>(items: T[], languageKey: keyof T, preferredLanguages: string[]): T[] => {
  if (!Array.isArray(items) || !preferredLanguages?.length) return items;

  const getFileLanguagePriority = (item: T): number => {
    const fileMap = item[languageKey];

    if (!fileMap || !(fileMap instanceof Map)) return 0;

    const availableLanguages = Array.from(fileMap.keys());

    return preferredLanguages.reduce((count, lang) => count + (availableLanguages.includes(lang) ? 1 : 0), 0);
  };

  return items.sort((a, b) => {
    const priorityA = getFileLanguagePriority(a);
    const priorityB = getFileLanguagePriority(b);

    return priorityB - priorityA; // Higher priority first
  });
};

export const applyFilters = (data: any[], query: any, language: string = "eng") => {
  const { minRating = 5, sortBy = "createdAt", sortOrder = "desc" } = query;
  console.log("sortOrder: ", sortOrder);
  console.log("sortBy: ", sortBy);
  console.log("minRating: ", minRating);

  // Filter by minimum average rating
  let filteredData = data.filter((item) => item.averageRating >= parseFloat(minRating));

  // Alphabetical sorting by the book name in the chosen language
  filteredData = filteredData.sort((a, b) => {
    const nameA = a.name[language] || a.name["eng"]; // Default to 'eng' if specific language is unavailable
    const nameB = b.name[language] || b.name["eng"];
    return nameA.localeCompare(nameB);
  });

  // Sorting by the specified field (`sortBy`), default is 'createdAt'
  filteredData = filteredData.sort((a, b) => {
    const dateA = new Date(a[sortBy]).getTime();
    const dateB = new Date(b[sortBy]).getTime();
    return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
  });

  // Filter based on language presence in the name field
  if (language !== "eng") {
    filteredData = filteredData.filter((item) => item.name[language]); // Exclude items without the specified language name
  }

  return filteredData;
};

export const convertToBoolean = (value: string) => {
  if (value === "true") return true;
  else if (value === "false") return false;
  else return value;
};

export const increaseReferredCountAndCredits = async (id: mongoose.Types.ObjectId) => {
  await usersModel.findByIdAndUpdate(id, { $inc: { referredCount: 1, creditsLeft: 10 } });
};

export const flaskTextToVideo = async (payload: any, res: Response) => {
  try {
    const flaskUrl = process.env.FLASK_BACKEND_ML_URL as string;
    const formData = new FormData();
    formData.append("image_url", `https://${AWS_BUCKET_NAME}.s3.${AWS_REGION}.amazonaws.com/${payload.projectAvatar}`);
    formData.append("text", payload.text);
    formData.append("text_language", payload.textLanguage);
    formData.append("preferred_voice", payload.preferredVoice);
    formData.append("subtitles", payload.subtitles);
    formData.append("subtitles_language", payload.subtitlesLanguage);
    formData.append("duration", payload.duration);
    const response = await axios.post(`${flaskUrl}/text-to-video`, formData, {
      timeout: 600000,
      responseType: "arraybuffer",
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    if (!response.data || !(response.data.length > 0)) {
      throw new Error("Empty or invalid video response from Flask API");
    }
    // Use the response data directly as a buffer
    const videoBuffer = Buffer.from(response.data);
    const videoFileName = `video_${Date.now()}.mp4`;

    const signedUrl = await generateSignedUrlToUploadOn(videoFileName, "video/mp4", payload.email);
    await axios.put(signedUrl, videoBuffer, {
      headers: {
        "Content-Type": "video/mp4",
      },
    });
    const s3Url = `https://${AWS_BUCKET_NAME}.s3.${AWS_REGION}.amazonaws.com/projects/${payload.email}/my-projects/${videoFileName}`;
    return s3Url;
  } catch (error) {
    return errorResponseHandler("An error occurred during the API call in flaskTextToVideo", httpStatusCode.INTERNAL_SERVER_ERROR, res);
  }
};

export const flaskAudioToVideo = async (payload: any, res: Response) => {
  try {
    const flaskUrl = process.env.FLASK_BACKEND_ML_URL as string;
    const formData = new FormData();
    formData.append("image_url", `https://${AWS_BUCKET_NAME}.s3.${AWS_REGION}.amazonaws.com/${payload.projectAvatar}`);
    formData.append("audio_url", `https://${AWS_BUCKET_NAME}.s3.${AWS_REGION}.amazonaws.com/${payload.audio}`);
    formData.append("subtitles", payload.subtitles);
    formData.append("subtitles_language", payload.subtitlesLanguage);
    formData.append("duration", payload.duration);

    const response = await axios.post(`${flaskUrl}/audio-to-video`, formData, {
      timeout: 600000,
      responseType: "arraybuffer",
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    if (!response.data || !(response.data.length > 0)) {
      throw new Error("Empty or invalid video response from Flask API");
    }
    // Use the response data directly as a buffer
    const videoBuffer = Buffer.from(response.data);
    const videoFileName = `video_${Date.now()}.mp4`;

    const signedUrl = await generateSignedUrlToUploadOn(videoFileName, "video/mp4", payload.email);
    await axios.put(signedUrl, videoBuffer, {
      headers: {
        "Content-Type": "video/mp4",
      },
    });
    const s3Url = `https://${AWS_BUCKET_NAME}.s3.${AWS_REGION}.amazonaws.com/projects/${payload.email}/my-projects/${videoFileName}`;
    return s3Url;
  } catch (error) {
    return errorResponseHandler("An error occurred during the API call in flaskAudioToVideo", httpStatusCode.INTERNAL_SERVER_ERROR, res);
  }
};

export const flaskTranslateVideo = async (payload: any, res: Response) => {
  try {
    const flaskUrl = process.env.FLASK_BACKEND_ML_URL as string;
    const formData = new FormData();
    formData.append("video_url", `https://${AWS_BUCKET_NAME}.s3.${AWS_REGION}.amazonaws.com/${payload.video}`);
    formData.append("original_text", payload.originalText);
    formData.append("translated_text", payload.translatedText);
    formData.append("image_url", `https://${AWS_BUCKET_NAME}.s3.${AWS_REGION}.amazonaws.com/${payload.projectAvatar}`);
    formData.append("preferred_voice", `https://${AWS_BUCKET_NAME}.s3.${AWS_REGION}.amazonaws.com/${payload.preferredVoice}`);
    formData.append("subtitles", payload.subtitles);
    formData.append("subtitles_language", payload.subtitlesLanguage);
    formData.append("duration", payload.duration);

    const response = await axios.post(`${flaskUrl}/video-translation`, formData, {
      timeout: 600000,
      responseType: "arraybuffer",
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    if (!response.data || !(response.data.length > 0)) {
      throw new Error("Empty or invalid video response from Flask API");
    }
    // Use the response data directly as a buffer
    const videoBuffer = Buffer.from(response.data);
    const videoFileName = `video_${Date.now()}.mp4`;

    const signedUrl = await generateSignedUrlToUploadOn(videoFileName, "video/mp4", payload.email);
    await axios.put(signedUrl, videoBuffer, {
      headers: {
        "Content-Type": "video/mp4",
      },
    });
    const s3Url = `https://${AWS_BUCKET_NAME}.s3.${AWS_REGION}.amazonaws.com/projects/${payload.email}/my-projects/${videoFileName}`;
    return s3Url;
  } catch (error) {
    return errorResponseHandler("An error occurred during the API call in flaskTranslateVideo", httpStatusCode.INTERNAL_SERVER_ERROR, res);
  }
};
