import mongoose from 'mongoose';

/**
 * Express middleware that validates `:id` style params are valid ObjectIds.
 * Returns 400 when the value cannot be cast to an ObjectId.
 */
export const checkObjectIdParam = (paramName) => (req, res, next) => {
  const value = req.params[paramName];
  if (!mongoose.Types.ObjectId.isValid(value)) {
    return res.status(400).json({
      success: false,
      message: `Invalid ${paramName}`,
    });
  }
  next();
};

/**
 * Validates that a value is a syntactically valid ObjectId.
 * Used before persisting document references.
 */
export const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(value);