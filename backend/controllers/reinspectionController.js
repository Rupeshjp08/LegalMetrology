import Reinspection from '../models/Reinspection.js';
import Notification from '../models/Notification.js';
import Response from '../models/Response.js';

// @desc    Create a new re-inspection
// @route   POST /api/member4/reinspections
export const createReinspection = async (req, res, next) => {
  try {
    const {
      notificationId,
      companyName,
      productName,
      previousViolation,
      responseId,
      reInspectionDate,
      officerName,
      inspectionResult,
      remarks,
    } = req.body;

    // Check if notification exists
    const notification = await Notification.findById(notificationId);
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found',
      });
    }

    // Check if referenced response exists (optional)
    if (responseId) {
      const response = await Response.findById(responseId);
      if (!response) {
        return res.status(404).json({
          success: false,
          message: 'Referenced response not found',
        });
      }
      if (String(response.notificationId) !== String(notificationId)) {
        return res.status(400).json({
          success: false,
          message: 'Response does not belong to the given notification',
        });
      }
    }

    // Set status based on inspection result
    let status;
    if (inspectionResult === 'Compliant') {
      status = 'Case Closed';
    } else if (inspectionResult === 'Still Violated') {
      status = 'Violation Confirmed';
    } else {
      return res.status(400).json({
        success: false,
        message: 'Inspection result must be either Compliant or Still Violated',
      });
    }

    // Create re-inspection
    const reinspection = await Reinspection.create({
      notificationId,
      companyName,
      productName,
      previousViolation,
      responseId,
      reInspectionDate,
      officerName,
      inspectionResult,
      remarks,
      status,
    });

    // Update the related notification status
    notification.status = status;
    await notification.save();

    res.status(201).json({
      success: true,
      data: reinspection,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get re-inspections by notification ID
// @route   GET /api/member4/reinspections/:notificationId
export const getReinspectionsByNotification = async (req, res, next) => {
  try {
    const reinspection = await Reinspection.findOne({
      notificationId: req.params.notificationId,
    }).sort({ createdAt: -1 });

if (!reinspection) {
      return res.status(404).json({
        success: false,
        message: 'Re-inspection not found',
      });
    }

    // Validate responseId reference on update when provided
    if (req.body.responseId) {
      const response = await Response.findById(req.body.responseId);
      if (!response) {
        return res.status(404).json({
          success: false,
          message: 'Referenced response not found',
        });
      }
      if (String(response.notificationId) !== String(req.body.notificationId || reinspection.notificationId)) {
        return res.status(400).json({
          success: false,
          message: 'Response does not belong to the given notification',
        });
      }
    }

    res.status(200).json({
      success: true,
      data: reinspection,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get re-inspection by ID
// @route   GET /api/member4/reinspections/:id
export const getReinspection = async (req, res, next) => {
  try {
    const reinspection = await Reinspection.findById(req.params.id);

    if (!reinspection) {
      return res.status(404).json({
        success: false,
        message: 'Re-inspection not found',
      });
    }

    res.status(200).json({
      success: true,
      data: reinspection,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a re-inspection
// @route   PUT /api/member4/reinspections/:id
export const updateReinspection = async (req, res, next) => {
  try {
    const reinspection = await Reinspection.findById(req.params.id);

    if (!reinspection) {
      return res.status(404).json({
        success: false,
        message: 'Re-inspection not found',
      });
    }

    // If updating inspectionResult, recalculate status and update notification
    if (req.body.inspectionResult) {
      if (req.body.inspectionResult === 'Compliant') {
        req.body.status = 'Case Closed';
      } else if (req.body.inspectionResult === 'Still Violated') {
        req.body.status = 'Violation Confirmed';
      }
    }

    const updated = await Reinspection.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    // If status changed, update the related notification
    if (req.body.inspectionResult) {
      const notification = await Notification.findById(reinspection.notificationId);
      if (notification) {
        notification.status = updated.status;
        await notification.save();
      }
    }

    res.status(200).json({
      success: true,
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};
