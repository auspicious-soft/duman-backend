import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

import { readProgressModel } from "../../models/user-reads/read-progress-schema";
import { queryBuilder } from "src/utils";
import { errorResponseHandler } from "src/lib/errors/error-response-handler";
import { badges, httpStatusCode } from "src/lib/constant";
import { Response } from "express";
import { awardsModel } from "src/models/awards/awards-schema";
import { PDFDocument, StandardFonts, degrees, rgb } from "pdf-lib";
import { Readable } from "stream";
import { uploadStreamToS3Service } from "src/config/s3";
import { fromBuffer } from "pdf2pic";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { createCanvas, loadImage } from "canvas";
import { usersModel } from "src/models/user/user-schema";
import { courseLessonsModel } from "src/models/course-lessons/course-lessons-schema";
import { sendNotification } from "src/utils/FCM/FCM";

// Resolve __filename and __dirname for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define image paths once at top
// const LogoPath = path.resolve(__dirname, "../../assets/logo.png");
const LogoPath = path.resolve(__dirname, "../../assets/Logo.png");
const CEOPath = path.resolve(__dirname, "../../assets/newbookstagramlogo.png");
const StampPath = path.resolve(__dirname, "../../assets/Bookstagramstamp.png");

export const generateCertificatePNGService = async (
  payload: { name: string; date: string; courseTitle: string },
  user: any
) => {
  try {
    const canvas = createCanvas(750, 500);
    const ctx = canvas.getContext("2d");

    // Set background color (white)
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, 750, 500);

    // Draw orange left sidebar
    ctx.fillStyle = "#D9966B"; // Orange color
    ctx.fillRect(0, 0, 100, 500);

    // Load and draw images
    let logoImage, ceoImage, stampImage;

    try {
      if (fs.existsSync(LogoPath)) {
        logoImage = await loadImage(LogoPath);
      } else {
        console.warn("Logo file does not exist at:", LogoPath);
      }
    } catch (error) {
      console.warn("Could not load logo image:", error);
    }

    try {
      if (fs.existsSync(CEOPath)) {
        ceoImage = await loadImage(CEOPath);
      } else {
        console.warn("CEO signature file does not exist at:", CEOPath);
      }
    } catch (error) {
      console.warn("Could not load CEO signature image:", error);
    }

    try {
      if (fs.existsSync(StampPath)) {
        stampImage = await loadImage(StampPath);
      } else {
        console.warn("Stamp file does not exist at:", StampPath);
      }
    } catch (error) {
      console.warn("Could not load stamp image:", error);
    }

    // Draw CEO image on sidebar if available
    if (ceoImage) {
      ctx.drawImage(ceoImage, 12, 75, 70, 325);
    }

    // Main "CERTIFICATE" heading
    ctx.fillStyle = "#262626";
    ctx.font = "bold 46px Arial, sans-serif";
    ctx.fillText("CERTIFICATE", 138, 100);

    // Subtitle
    ctx.fillStyle = "#808080";
    ctx.font = "16px Arial, sans-serif";
    ctx.fillText("ON COMPLETION OF THE COURSE", 140, 130);

    // "this certificate confirms that," text
    ctx.fillStyle = "#999999";
    ctx.font = "12px Arial, sans-serif";
    ctx.fillText("this certificate confirms that,", 140, 200);

    // Person's name (larger, bold, dark)
    ctx.fillStyle = "#1A1A1A";
    ctx.font = "bold 30px Arial, sans-serif";
    ctx.fillText(payload.name, 140, 240);

    // Completion text
    ctx.fillStyle = "#333333";
    ctx.font = "16px Arial, sans-serif";
    ctx.fillText("has successfully completed the course", 140, 280);

    // Course title in quotes
    ctx.fillText(`"${payload.courseTitle}"`, 140, 305);

    // Platform name
    ctx.fillText("Bookstagram platform", 140, 330);

    // Draw logo image if available
    if (logoImage) {
      ctx.drawImage(logoImage, 410, 5, 350, 350);
    } else {
      // Fallback: Create simple Bookstagram logo
      const logoX = 575;
      const logoY = 295;
      const logoRadius = 40;

      // Outer blue ring
      ctx.beginPath();
      ctx.arc(logoX, logoY, logoRadius, 0, 2 * Math.PI);
      ctx.fillStyle = "#1E90FF";
      ctx.fill();

      // Middle white ring
      ctx.beginPath();
      ctx.arc(logoX, logoY, logoRadius - 6, 0, 2 * Math.PI);
      ctx.fillStyle = "#FFFFFF";
      ctx.fill();

      // Inner blue circle
      ctx.beginPath();
      ctx.arc(logoX, logoY, logoRadius - 12, 0, 2 * Math.PI);
      ctx.fillStyle = "#1E90FF";
      ctx.fill();

      // Book shape in center
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(logoX - 12, logoY - 15, 24, 30);

      // Book pages (lines)
      ctx.strokeStyle = "#1E90FF";
      ctx.lineWidth = 1;
      for (let i = -10; i <= 10; i += 5) {
        ctx.beginPath();
        ctx.moveTo(logoX - 8, logoY + i);
        ctx.lineTo(logoX + 8, logoY + i);
        ctx.stroke();
      }
    }

    // Draw stamp if available
    if (stampImage) {
      ctx.drawImage(stampImage, 140, 335, 185, 150);
    }

    // Date section in bottom right
    ctx.fillStyle = "#999999";
    ctx.font = "12px Arial, sans-serif";
    ctx.fillText("Date of Issue", 600, 420);

    ctx.fillStyle = "#333333";
    ctx.font = "bold 16px Arial, sans-serif";
    ctx.fillText(payload.date, 590, 440);

    // Convert canvas to buffer
    const buffer = canvas.toBuffer("image/png");

    // Convert buffer to readable stream
    const bufferStream = new Readable();
    bufferStream.push(buffer);
    bufferStream.push(null); // Signal end of stream

    // Generate unique file name
    const fileName = `certificate_png_${payload.name.replace(/\s+/g, "_")}_${Date.now()}.png`;
    const fileType = "image/png";

    // Upload to S3 using the provided service
    const imageKey = await uploadStreamToS3Service(bufferStream, fileName, fileType, user.email);

    console.log(`PNG Certificate generated and uploaded to S3 with key: ${imageKey}`);

    return {
      success: true,
      message: "PNG Certificate generated and uploaded successfully",
      data: {
        s3Key: imageKey,
        fileName: fileName,
        format: "PNG",
      },
    };
  } catch (error: any) {
    console.error("Error generating PNG certificate:", error);
    return {
      success: false,
      message: "Failed to generate and upload PNG certificate",
      data: null,
      error: error.message,
    };
  }
};

export const generateCertificateService = async (
  payload: { name: string; date: string; courseTitle: string },
  user: any
) => {
  try {
    // Create a new PDF document
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([750, 500]);
    const { width, height } = page.getSize();

    // Load fonts
    const timesRomanFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const helveticaBoldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Load and embed images
    let logoImage, ceoImage, stampImage;

    // Logo
    try {
      if (fs.existsSync(LogoPath)) {
        const logoImageBytes = fs.readFileSync(LogoPath);
        logoImage = await pdfDoc.embedPng(logoImageBytes);
      } else {
        console.warn("Logo file does not exist at:", LogoPath);
      }
    } catch (error) {
      console.warn("Could not load logo image:", error);
    }

    // CEO signature
    try {
      if (fs.existsSync(CEOPath)) {
        const ceoImageBytes = fs.readFileSync(CEOPath);
        ceoImage = await pdfDoc.embedPng(ceoImageBytes);
      } else {
        console.warn("CEO signature file does not exist at:", CEOPath);
      }
    } catch (error) {
      console.warn("Could not load CEO signature:", error);
    }

    // Stamp
    try {
      if (fs.existsSync(StampPath)) {
        const stampImageBytes = fs.readFileSync(StampPath);
        stampImage = await pdfDoc.embedPng(stampImageBytes);
      } else {
        console.warn("Stamp file does not exist at:", StampPath);
      }
    } catch (error) {
      console.warn("Could not load stamp image:", error);
    }

    // Background
    page.drawRectangle({
      x: 0,
      y: 0,
      width: width,
      height: height,
      color: rgb(1.0, 1.0, 1.0),
    });

    // Sidebar
    page.drawRectangle({
      x: 0,
      y: 0,
      width: 100,
      height: height,
      color: rgb(0.85, 0.6, 0.35),
    });

    if (ceoImage) {
      page.drawImage(ceoImage, {
        x: 12,
        y: height / 2 - 150,
        width: 70,
        height: 325,
      });
    }

    // Main "CERTIFICATE" heading
    page.drawText("CERTIFICATE", {
      x: 138,
      y: height - 100,
      size: 46,
      font: helveticaBoldFont,
      color: rgb(0.15, 0.15, 0.15),
    });

    // Subtitle
    page.drawText("ON COMPLETION OF THE COURSE", {
      x: 140,
      y: height - 130,
      size: 16,
      font: helveticaFont,
      color: rgb(0.5, 0.5, 0.5),
    });

    // "this certificate confirms that,"
    page.drawText("this certificate confirms that,", {
      x: 140,
      y: height - 200,
      size: 12,
      font: helveticaFont,
      color: rgb(0.6, 0.6, 0.6),
    });

    // Person's name
    page.drawText(payload.name, {
      x: 140,
      y: height - 230,
      size: 30,
      font: helveticaBoldFont,
      color: rgb(0.1, 0.1, 0.1),
    });

    // Completion text
    page.drawText("has successfully completed the course", {
      x: 140,
      y: height - 270,
      size: 16,
      font: helveticaFont,
      color: rgb(0.2, 0.2, 0.2),
    });

    // Course title
    page.drawText(`"${payload.courseTitle}"`, {
      x: 140,
      y: height - 295,
      size: 16,
      font: helveticaFont,
      color: rgb(0.2, 0.2, 0.2),
    });

    // Platform name
    page.drawText("Bookstagram platform", {
      x: 140,
      y: height - 320,
      size: 16,
      font: helveticaFont,
      color: rgb(0.2, 0.2, 0.2),
    });

    // Logo placement
    const logoX = 180;
    const logoY = 120;

    if (logoImage) {
      page.drawImage(logoImage, {
        x: logoX - -270,
        y: logoY - -50,
        width: 330,
        height: 330,
      });
    } else {
      // Fallback drawing
      const logoRadius = 40;

      page.drawCircle({
        x: logoX,
        y: logoY,
        size: logoRadius,
        color: rgb(0.12, 0.56, 1),
      });
      page.drawCircle({
        x: logoX,
        y: logoY,
        size: logoRadius - 6,
        color: rgb(1, 1, 1),
      });
      page.drawCircle({
        x: logoX,
        y: logoY,
        size: logoRadius - 12,
        color: rgb(0.12, 0.56, 1),
      });
      page.drawRectangle({
        x: logoX - 12,
        y: logoY - 15,
        width: 24,
        height: 30,
        color: rgb(1, 1, 1),
      });
      for (let i = -10; i <= 10; i += 5) {
        page.drawLine({
          start: { x: logoX - 8, y: logoY + i },
          end: { x: logoX + 8, y: logoY + i },
          thickness: 1,
          color: rgb(0.12, 0.56, 1),
        });
      }
    }

    // Stamp
    if (stampImage) {
      page.drawImage(stampImage, {
        x: 140,
        y: 0,
        width: 185,
        height: 155,
      });
    }

    // Date section in bottom right
    page.drawText("Date of Issue", {
      x: width - 150,
      y: 80,
      size: 12,
      font: helveticaFont,
      color: rgb(0.6, 0.6, 0.6),
    });

    page.drawText(payload.date, {
      x: width - 160,
      y: 60,
      size: 16,
      font: helveticaBoldFont,
      color: rgb(0.2, 0.2, 0.2),
    });

    // Generate PDF buffer
    const pdfBytes = await pdfDoc.save();
    const bufferStream = new Readable();
    bufferStream.push(pdfBytes);
    bufferStream.push(null);

    const fileName = `certificate_${payload.name.replace(/\s+/g, "_")}_${Date.now()}.pdf`;
    const fileType = "application/pdf";

    const imageKey = await uploadStreamToS3Service(bufferStream, fileName, fileType, user.email);
    console.log(`Certificate generated and uploaded to S3 with key: ${imageKey}`);

    return {
      success: true,
      message: "Certificate generated and uploaded successfully",
      data: {
        s3Key: imageKey,
        fileName: fileName,
      },
    };
  } catch (error: any) {
    console.error("Error generating certificate:", error);
    return {
      success: false,
      message: "Failed to generate and upload certificate",
      data: null,
      error: error.message,
    };
  }
};

export const generateCertificateBothFormatsService = async (data: any, user: any,res:Response) => {
  try {
    const userDetail: any = await usersModel.findById(user.id);
    if (!userDetail) {
      throw new Error("User not found");
    }
    let course: any = await readProgressModel
      .findOne({ userId: user.id, bookId: data.courseId })
      .populate("bookId");
    if (!course) {
      course = await readProgressModel.create({
        userId: user.id,
        bookId: data.courseId,
        // other default fields if needed
      });
      course = await readProgressModel
        .findById(course._id)
        .populate("bookId");
    }
    if (course.certificatePdf && course.certificatePng) {
      return {
        success: true,
        message: "Certificate already exists",
        data: {
          pdf: { s3Key: course.certificatePdf },
          png: { s3Key: course.certificatePng },
        },
      };
    }
    let name;
    if (userDetail.fullName) {
      name = userDetail.fullName.eng;
    } else if (userDetail.firstName) {
      name =
        userDetail.firstName.eng !== null
          ? userDetail.firstName.eng
          : userDetail.firstName.kaz !== null
          ? userDetail.firstName.kaz
          : userDetail.firstName.rus !== null
          ? userDetail.firstName.rus
          : "";
    }

    const payload = {
      name: name,
      date: new Date().toLocaleDateString(),
      courseTitle: course?.bookId?.name?.eng ?? course?.bookId?.name?.rus ?? course?.bookId?.name?.kaz,
    };
    const pdfResult = await generateCertificateService(payload, user);
    const pngResult = await generateCertificatePNGService(payload, user);

    if (pdfResult.data && pngResult.data) {
      course.certificatePdf = pdfResult.data.s3Key;
      course.certificatePng = pngResult.data.s3Key;
      await course.save();
    }
    course.isCompleted = true;
    course.progress = 100;
    await course.save();
     const users = await usersModel.find({_id:user.id}).select("fcmToken");
    if (!users.length) return errorResponseHandler("No users found", httpStatusCode.NO_CONTENT,res);
  
    const fcmPromises = users.map((user) => {
      const userIds = [user._id];
      return sendNotification({ userIds, type: "Certificate_Created" });
    });
  
    await Promise.all(fcmPromises);
    return {
      success: pdfResult.success && pngResult.success,
      message: "Certificates generated in both formats",
      data: {
        pdf: pdfResult.data,
        png: pngResult.data,
      },
    };
  } catch (error: any) {
    console.error("Error generating certificates in both formats:", error);
    return {
      success: false,
      message: "Failed to generate certificates in both formats",
      data: null,
      error: error.message,
    };
  }
};

export const getCourseProgress = async (courseId: string, lang: string, userId: string) => {
	try {
		// Fetch all lessons for the given courseId and language
		const lessons = await courseLessonsModel.find({ productId: courseId, lang }).sort({ srNo: 1 }).lean();

		// Fetch user's read progress for the course
		const readProgress = await readProgressModel.findOne({ userId, bookId: courseId }).lean();
		console.log('readProgress: ', readProgress);

		// Initialize the result array
		const result = [];

		// Process each lesson
		for (let i = 0; i < lessons.length; i++) {
			const lesson = lessons[i];
			const lessonProgress = {
				Srno: lesson.srNo,
				lessonId: lesson._id,
				isOpen: false, // Default to false
				session: lesson.subLessons.map((subLesson) => ({
					Srno: subLesson.srNo,
					sessionId: subLesson._id,
					isRead: readProgress?.readSections?.some((section) => section.courseLessonId?.toString() === lesson._id.toString() && section.sectionId?.toString() === subLesson._id.toString()) || false,
				})),
			};

			// Determine if the lesson is open
			if (lesson.srNo === 1) {
				// First lesson is always open
				lessonProgress.isOpen = true;
			} else {
				// Check if all sessions in the previous lesson are read
				const prevLesson = lessons[i - 1];
				const prevLessonRead = prevLesson.subLessons.every((subLesson) => readProgress?.readSections?.some((section) => section.courseLessonId?.toString() === prevLesson._id.toString() && section.sectionId?.toString() === subLesson._id.toString()));
				lessonProgress.isOpen = prevLessonRead;
			}

			result.push(lessonProgress);
		}

		return result;
	} catch (error) {
		console.error("Error in getCourseProgress:", error);
		throw error;
	}
};

export const updateCourseStatusService = async (courseId: string, userData: any) => {
	try {
		// Find the read progress for the user and course
		const readProgress = await readProgressModel.findOne({ userId: userData.id, bookId: courseId });

		if (!readProgress) {
			throw new Error("Read progress not found for the user and course");
		}

		// Update the isCompleted status based on progress
		readProgress.isCompleted = true;
		readProgress.progress = 100; // Set progress to 100% as the course is completed
		// Save the updated read progress
		await readProgress.save();

		return {
			success: true,
			message: "Course status updated successfully",
			data: { isCompleted: readProgress.isCompleted },
		};
	} catch (error) {
		console.error("Error updating course status:", error);
		throw error;
	}
};


export const getReadProgressById = async (readProgressId: string, userId: string) => {
	return await readProgressModel.findOne({ userId, bookId: readProgressId }).populate([{ path: "bookId" }, { path: "readSections.sectionId" }]);
};

export const getCourseCertificateService = async (readProgressId: string, userId: string,res:Response) => {
	const certificate = await readProgressModel.findOne({ userId, bookId: readProgressId }).select("certificatePdf certificatePng");
	 
  return {
		success: true,
		message: "Course certificate retrieved successfully",
		data: certificate,
	};
};
export const createReadProgressService = async (payload: any,res:Response) => {
	const readProgress = await readProgressModel.create(payload);
  return {
		success: true,
		message: "Read progress created successfully",
		data: readProgress,
	};
};


export const updateReadProgress = async (readProgressId: string, readProgressData: any, user: any, res: Response) => {
	if (readProgressData.progress < 0 || readProgressData.progress > 100) {
		return errorResponseHandler("Progress must be between 0 and 100", httpStatusCode.BAD_REQUEST, res);
	}
	const userId = user.id;
	let updatedBadge = null;

	const existingProgress = await readProgressModel.findOne({ userId, bookId: readProgressId });

	if (existingProgress && readProgressData.progress < existingProgress.progress) {
		return errorResponseHandler("Progress cannot be decreased", httpStatusCode.BAD_REQUEST, res);
	}

	const updateData: any = { progress: readProgressData.progress, audiobookProgress: readProgressData.audiobookProgress || existingProgress?.audiobookProgress || 0 };
	if (readProgressData.courseLessonId && readProgressData.sectionId) {
		updateData.$push = { readSections: { courseLessonId: readProgressData.courseLessonId, sectionId: readProgressData.sectionId } };
	}
	if (readProgressData.readAudioChapter) {
		updateData.$push = { readAudioChapter: { audioChapterId: readProgressData.readAudioChapter } };
	}
    
	const ReadProgress = await readProgressModel.findOneAndUpdate(
		{ userId, bookId: readProgressId }, 
		updateData, 
		{ new: true, upsert: true }
	).populate("bookId");

	if (!ReadProgress) {
		return errorResponseHandler("Read Progress not found", httpStatusCode.NOT_FOUND, res);
	}

	if (readProgressData.progress === 100 || ReadProgress.audiobookProgress === 100) {
		const bookRead = await readProgressModel.countDocuments({ 
      userId, 
			$or: [
        { progress: 100 },
				{ audiobookProgress: 100 }
			]
		});
    console.log('bookRead: ', bookRead);
		// await readProgressModel.findOneAndUpdate(
		// 	{ userId, bookId: readProgressId }, 
		// 	// { isCompleted: true }, 
		// 	{ new: true }
		// );
		//TODO: check that the badge will be considered for books only or all?
		const awardedBadge = badges.find(({ count }) => bookRead === count);
    console.log('awardedBadge: ', awardedBadge);

		if (awardedBadge) {
			updatedBadge = await awardsModel.create(
				{ userId, level: awardedBadge.level, badge: awardedBadge.badge },
			);
		}
	}

	return {
		success: true,
		message: "Read Progress updated successfully",
		data: { ReadProgress, updatedBadge },
	};
};



export const getAllReadProgress = async (payload: any, user: any) => {
	const page = parseInt(payload.page as string) || 1;
	const limit = parseInt(payload.limit as string) || 0;
	const offset = (page - 1) * limit;
	const { query, sort } = queryBuilder(payload, ["userId", "bookId"]);

	(query as any).userId = user.id;

	if (payload.type === "finished") {
		(query as any).progress = 100;
	} else if (payload.type === "reading") {
		(query as any).progress = { $lt: 100 };
	}

	const totalDataCount = await readProgressModel.countDocuments(query);

	const results = await readProgressModel.find(query).sort(sort).skip(offset).limit(limit).select("-__v");

	return {
		page,
		limit,
		message: "Read Progress retrieved successfully",
		success: results.length > 0,
		total: totalDataCount,
		data: results,
	};
};
