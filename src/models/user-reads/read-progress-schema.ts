import mongoose from "mongoose";

const readProgressSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },
    bookId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "products",
      required: true,
    },
    progress: {
      type: Number,
      default: 0,
    },
    readSections: [
      {
        courseLessonId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "courseLessons", // Reference the courseLesson model
          // required: true,
        },
        sectionId: {
          type: mongoose.Schema.Types.ObjectId, // Store the section’s _id
          // required: true,
        },
      },
    ],
    readAudioChapter: [
      {
        audioChapterId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "audiobookChapters", 
          // required: true,
        },
      },
    ],
    certificatePng: {
      type: String,
      default: null,
    },
    certificatePdf: {
      type: String,
      default: null,
    },
    isCompleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export const readProgressModel = mongoose.model("readProgress", readProgressSchema);
