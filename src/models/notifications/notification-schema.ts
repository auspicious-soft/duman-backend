import { Schema, Types, model } from 'mongoose';

const notificationsSchema = new Schema({
    userIds: {
        type: [Schema.ObjectId],
        ref: "users"
    },
    title: {
        type: Object,
        required: true
    },
    description: {
        type: Object,
        required: true
    },
    isRead: {
        type: Boolean,
        default: false
    },
    date: {
        type: Date,
        default: Date.now
    },
    type: {
        type: String,
        required: true,
        enum: ["admin", "user", "Author_Created"]
    },
    language: { type: String, enum: ["eng", "kaz", "rus"], default: "eng" },
    metadata: { type: Schema.Types.Mixed },
    referenceId: {
      publisherId: { type: Schema.Types.ObjectId, ref: "publishers" },
      authorId: { type: Schema.Types.ObjectId, ref: "authors" },
    //   subscriptionId: { type: Schema.Types.ObjectId, ref: "subscription" },
    },
},
    { timestamps: true }
)

export const notificationsModel = model('notifications', notificationsSchema)