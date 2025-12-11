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
      // set: (value: number) => Math.floor(value), 
    },
    audiobookProgress: {
      type: Number,
      default: 0,
      set: (value: number) => Math.floor(value), 
    },
    highestProgress: {
      type: Number,
      default: 0,
      set: (value: number) => Math.floor(value), 
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





// import mongoose from "mongoose";

// const readProgressSchema = new mongoose.Schema(
//   {
//     userId: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "users",
//       required: true,
//     },
//     bookId: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "products",
//       required: true,
//     },
//     progress: {
//       type: Number,
//       default: 0,
//       set: (value: number) => Math.floor(value),
//     },
//     audiobookProgress: {
//       type: Number,
//       default: 0,
//       set: (value: number) => Math.floor(value),
//     },
//     highestProgress: {
//       type: Number,
//       default: 0,
//     },
//     readSections: [
//       {
//         courseLessonId: {
//           type: mongoose.Schema.Types.ObjectId,
//           ref: "courseLessons",
//         },
//         sectionId: {
//           type: mongoose.Schema.Types.ObjectId,
//         },
//       },
//     ],
//     readAudioChapter: [
//       {
//         audioChapterId: {
//           type: mongoose.Schema.Types.ObjectId,
//           ref: "audiobookChapters",
//         },
//       },
//     ],
//     certificatePng: {
//       type: String,
//       default: null,
//     },
//     certificatePdf: {
//       type: String,
//       default: null,
//     },
//     isCompleted: {
//       type: Boolean,
//       default: false,
//     },
//   },
//   { timestamps: true }
// );

// // Pre-save middleware for .save() and .create()
// readProgressSchema.pre("save", function (next) {
//   this.highestProgress = Math.max(this.progress || 0, this.audiobookProgress || 0);
//   next();
// });

// // Pre-findOneAndUpdate middleware for .findOneAndUpdate()
// readProgressSchema.pre("findOneAndUpdate", function (next) {
//   if (update !== null) { 
//   const update = this.getUpdate();
//   const progress = update.progress ?? update.$set?.progress;
//   const audiobookProgress = update.audiobookProgress ?? update.$set?.audiobookProgress;
//   }
//   // Only update highestProgress if progress or audiobookProgress is being updated
//   if (progress !== undefined || audiobookProgress !== undefined) {
//     const currentDoc = this.model.findOne(this.getQuery()).lean();
//     currentDoc.then((doc) => {
//       const currentProgress = doc?.progress || 0;
//       const currentAudiobookProgress = doc?.audiobookProgress || 0;
//       const newProgress = progress !== undefined ? Math.floor(progress) : currentProgress;
//       const newAudiobookProgress = audiobookProgress !== undefined ? Math.floor(audiobookProgress) : currentAudiobookProgress;
//       this.set("highestProgress", Math.max(newProgress, newAudiobookProgress));
//       next();
//     }).catch(next);
//   } else {
//     next();
//   }
// });

// export const readProgressModel = mongoose.model("readProgress", readProgressSchema);