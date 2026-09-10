import Response from '../models/Response.js';
import Notification from '../models/Notification.js';

// @desc    Create a new response for a notification
// @route   POST /api/member4/responses
export const createResponse = async (req, res, next) => {
  try {
    const { notificationId, responseType, responseMessage, responseDate } = req.body;

    // Check if notification exists
    const notification = await Notification.findById(notificationId);
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found',
      });
    }

    // Create the response
    const response = await Response.create({
      notificationId,
      responseType,
      responseMessage,
      responseDate,
    });

    // Update notification status to "Response Submitted"
    notification.status = 'Response Submitted';
    await notification.save();

    res.status(201).json({
      success: true,
      data: response,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get responses for a notification
// @route   GET /api/member4/responses/:notificationId
export const getResponsesByNotification = async (req, res, next) => {
  try {
    const responses = await Response.find({
      notificationId: req.params.notificationId,
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: responses.length,
      data: responses,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a response
// @route   PUT /api/member4/responses/:id
export const updateResponse = async (req, res, next) => {
  try {
    const response = await Response.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!response) {
      return res.status(404).json({
        success: false,
        message: 'Response not found',
      });
    }

    res.status(200).json({
      success: true,
      data: response,
    });
  } catch (error) {
    next(error);
  }
};
