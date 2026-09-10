import mongoose from 'mongoose';

const reinspectionSchema = new mongoose.Schema(
  {
    notificationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Notification',
      required: [true, 'Notification ID is required'],
    },
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
    previousViolation: {
      type: String,
      required: [true, 'Previous violation description is required'],
      trim: true,
    },
    responseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Response',
    },
    reInspectionDate: {
      type: Date,
      required: [true, 'Re-inspection date is required'],
    },
    officerName: {
      type: String,
      required: [true, 'Officer name is required'],
      trim: true,
    },
    inspectionResult: {
      type: String,
      enum: {
        values: ['Compliant', 'Still Violated'],
        message: '{VALUE} is not a valid inspection result',
      },
      required: [true, 'Inspection result is required'],
    },
    remarks: {
      type: String,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      enum: ['Case Closed', 'Violation Confirmed'],
      required: true,
    },
  },
  {
    collection: 'member4_reinspections',
    timestamps: true,
  }
);

reinspectionSchema.index({ notificationId: 1 });
reinspectionSchema.index({ notificationId: 1, createdAt: -1 });
reinspectionSchema.index({ responseId: 1 });

const Reinspection = mongoose.model('Reinspection', reinspectionSchema);

export default Reinspection;