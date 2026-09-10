import mongoose from 'mongoose';

const responseSchema = new mongoose.Schema(
  {
    notificationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Notification',
      required: [true, 'Notification ID is required'],
    },
    responseType: {
      type: String,
      enum: {
        values: ['Accept Violation', 'Dispute Violation', 'Corrective Action Taken'],
        message: '{VALUE} is not a valid response type',
      },
      required: [true, 'Response type is required'],
    },
    responseMessage: {
      type: String,
      required: [true, 'Response message is required'],
      trim: true,
    },
    responseDate: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ['Submitted', 'Under Review', 'Accepted', 'Rejected'],
      default: 'Submitted',
    },
  },
  {
    collection: 'member4_company_responses',
    timestamps: true,
  }
);

responseSchema.index({ notificationId: 1 });
responseSchema.index({ notificationId: 1, createdAt: -1 });

const Response = mongoose.model('Response', responseSchema);

export default Response;