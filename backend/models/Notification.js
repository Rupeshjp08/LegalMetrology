import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    companyName: {
      type: String,
      required: [true, 'Company name is required'],
      trim: true,
    },
    productName: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
    },
    productId: {
      type: String,
      required: [true, 'Product ID is required'],
      trim: true,
    },
    batchNumber: {
      type: String,
      required: [true, 'Batch number is required'],
      trim: true,
    },
    violation: {
      type: String,
      required: [true, 'Violation description is required'],
      trim: true,
    },
    rule: {
      type: String,
      required: [true, 'Rule reference is required'],
      trim: true,
    },
    inspectionDate: {
      type: Date,
      required: [true, 'Inspection date is required'],
    },
    noticeDate: {
      type: Date,
      default: Date.now,
    },
    officerName: {
      type: String,
      required: [true, 'Officer name is required'],
      trim: true,
    },
    status: {
      type: String,
      enum: [
        'Pending Response',
        'Response Submitted',
        'Re-inspection Scheduled',
        'Compliant',
        'Violation Confirmed',
        'Case Closed',
      ],
      default: 'Pending Response',
    },
  },
  {
    collection: 'member4_notifications',
    timestamps: true,
  }
);

notificationSchema.index({ status: 1 });
notificationSchema.index({ companyName: 1 });
notificationSchema.index({ productId: 1 });
notificationSchema.index({ companyName: 1, productId: 1 });
notificationSchema.index({ batchNumber: 1 });

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;