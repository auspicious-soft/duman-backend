import { Response, Request } from "express";
import { customAlphabet } from "nanoid";
import { httpStatusCode } from "src/lib/constant";
import { errorResponseHandler } from "src/lib/errors/error-response-handler";
import { faqsModel } from "src/models/FAQs/FAQs-schema";

// Create FAQ
export const createFAQService = async (payload: any, res: Response) => {
	try {
		const identifier = customAlphabet("0123456789", 5);
		payload.identifier = identifier();
		const faq = await faqsModel.create(payload);
		return { success: true, message: "FAQ created successfully", data: faq };
	} catch (error) {
		console.error("Error in createFAQService:", error);
		throw error;
	}
};


// Get Single FAQ
// export const getAllFAQService = async (res: Response, page: number = 1, limit: number = 10, type: string | undefined, search: string | undefined) => {
// 	// Convert page and limit to integers and ensure they are positive
// 	const currentPage = Math.max(1, parseInt(page.toString(), 10));
// 	const itemsPerPage = Math.max(1, parseInt(limit.toString(), 10));


// 	let faqs 
//     if (search) {
//         const searchRegex = new RegExp(search, 'i'); // Case-insensitive regex for searching
//         faqs = await faqsModel.find({
//             $or: [
//                 { question: { $regex: searchRegex } },
//                 { answer: { $regex: searchRegex } }
//             ]
//         }).sort({ createdAt: -1 }).exec();
//     } else {
//         faqs = await faqsModel.find().sort({ createdAt: -1 }).exec();
//     }
// 	const types = [...new Set(faqs.map((faq) => faq.type))];
// 	const filteredFaqs = type ? faqs.filter((faq) => faq.type === type) : faqs;

// 	return {
// 		success: true,
// 		message: "FAQs fetched successfully",
// 		types,
// 		data: filteredFaqs,
// 	};
// };


export const getAllFAQService = async (
	res: Response,
	page: number = 1,
	limit: number = 10,
	type: string | undefined,
	search: string | undefined
) => {
	// Ensure valid page and limit
	const currentPage = Math.max(1, parseInt(page.toString(), 10));
	const itemsPerPage = Math.max(1, parseInt(limit.toString(), 10));

	let faqs;
    const types = await faqsModel.distinct("type").exec();
	if (search) {
		const searchRegex = new RegExp(search, 'i');
		faqs = await faqsModel.find({
			$or: [
				{ question: { $regex: searchRegex } },
				{ answer: { $regex: searchRegex } }
			]
		}).sort({ createdAt: -1 }).exec();
	} else {
		faqs = await faqsModel.find().sort({ createdAt: -1 }).exec();
	}

	// Get all available types from fetched FAQs (after search or full fetch)
	// const types = [...new Set(faqTypes.map(faq => faq.type))];

	// If no type is provided, default to the first available type
	const selectedType = type || types[0];

	// Filter by selected type
	const filteredFaqs = faqs.filter(faq => faq.type === selectedType);

	// Apply pagination
	const startIndex = (currentPage - 1) * itemsPerPage;
	const paginatedFaqs = filteredFaqs.slice(startIndex, startIndex + itemsPerPage);

	return {
		success: true,
		message: "FAQs fetched successfully",
		total: filteredFaqs.length,
		page: currentPage,
		limit: itemsPerPage,
		types, // All available types (not filtered by type)
		data: paginatedFaqs,
		selectedType,
	};
};



export const getFAQByIdService = async (id: string, res: Response) => {
	try {
		const faq = await faqsModel.findById(id);
		if (!faq) return errorResponseHandler("FAQ not found", httpStatusCode.NOT_FOUND, res);
		return { success: true, message: "FAQ fetched successfully", data: faq };
	} catch (error) {
		console.error("Error in getFAQByIdService:", error);
		throw error;
	}
};

// Update FAQ
export const updateFAQService = async (id: string, payload: any, res: Response) => {
	try {
		const faq = await faqsModel.findByIdAndUpdate(id, payload, { new: true });
		if (!faq) return errorResponseHandler("FAQ not found", httpStatusCode.NOT_FOUND, res);
		return { success: true, message: "FAQ updated successfully", data: faq };
	} catch (error) {
		console.error("Error in updateFAQService:", error);
		throw error;
	}
};

// Delete FAQ
export const deleteFAQService = async (id: string, res: Response) => {
	try {
		const faq = await faqsModel.findByIdAndDelete(id);
		if (!faq) return errorResponseHandler("FAQ not found", httpStatusCode.NOT_FOUND, res);
		return { success: true, message: "FAQ deleted successfully" };
	} catch (error) {
		console.error("Error in deleteFAQService:", error);
		throw error;
	}
};
