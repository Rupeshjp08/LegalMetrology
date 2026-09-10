import { Router } from 'express';
import { body } from 'express-validator';
import validate from '../middleware/validate.js';
import { checkObjectIdParam } from '../middleware/objectId.js';
import {
  createResponse,
  getResponsesByNotification,
  updateResponse,
} from '../controllers/responseController.js';

const router = Router();
const checkNotificationId = checkObjectIdParam('notificationId');
const checkId = checkObjectIdParam('id');

const createResponseValidation = [
  body('notificationId')
    .notEmpty()
    .withMessage('Notification ID is required')
    .isMongoId()
    .withMessage('Notification ID must be a valid ObjectId'),
  body('responseType')
    .isIn(['Accept Violation', 'Dispute Violation', 'Corrective Action Taken'])
    .withMessage('Response type must be Accept Violation, Dispute Violation, or Corrective Action Taken'),
  body('responseMessage').notEmpty().withMessage('Response message is required'),
];

const updateResponseValidation = [
  body('responseType')
    .optional()
    .isIn(['Accept Violation', 'Dispute Violation', 'Corrective Action Taken'])
    .withMessage('Response type must be Accept Violation, Dispute Violation, or Corrective Action Taken'),
  body('responseMessage').optional().notEmpty().withMessage('Response message cannot be empty'),
  body('status')
    .optional()
    .isIn(['Submitted', 'Under Review', 'Accepted', 'Rejected'])
    .withMessage('Invalid status value'),
];

router.post('/', createResponseValidation, validate, createResponse);
router.get('/:notificationId', checkNotificationId, getResponsesByNotification);
router.put('/:id', checkId, updateResponseValidation, validate, updateResponse);

export default router;
