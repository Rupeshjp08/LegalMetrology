import Notification from '../models/Notification.js';

// @desc    Create a new notification
// @route   POST /api/member4/notifications
export const createNotification = async (req, res, next) => {
  try {
    const { companyName, productName, productId, batchNumber, violation, rule, inspectionDate, noticeDate, officerName } = req.body;

    const notification = await Notification.create({
      companyName,
      productName,
      productId,
      batchNumber,
      violation,
      rule,
      inspectionDate,
      noticeDate,
      officerName,
    });

    res.status(201).json({
      success: true,
      data: notification,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all notifications
// @route   GET /api/member4/notifications
export const getNotifications = async (req, res, next) => {
  try {
    const notifications = await Notification.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: notifications.length,
      data: notifications,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single notification by ID
// @route   GET /api/member4/notifications/:id
export const getNotification = async (req, res, next) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found',
      });
    }

    res.status(200).json({
      success: true,
      data: notification,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a notification
// @route   PUT /api/member4/notifications/:id
export const updateNotification = async (req, res, next) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found',
      });
    }

    res.status(200).json({
      success: true,
      data: notification,
    });
  } catch (error) {
    next(error);
  }
};
