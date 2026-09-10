import { Router } from 'express';
import { body } from 'express-validator';
import validate from '../middleware/validate.js';
import { checkObjectIdParam } from '../middleware/objectId.js';
import {
  createNotification,
  getNotifications,
  getNotification,
  updateNotification,
} from '../controllers/notificationController.js';

const router = Router();
const checkId = checkObjectIdParam('id');

const createNotificationValidation = [
  body('companyName').notEmpty().withMessage('Company name is required'),
  body('productName').notEmpty().withMessage('Product name is required'),
  body('productId').notEmpty().withMessage('Product ID is required'),
  body('batchNumber').notEmpty().withMessage('Batch number is required'),
  body('violation').notEmpty().withMessage('Violation description is required'),
  body('rule').notEmpty().withMessage('Rule reference is required'),
  body('inspectionDate').isISO8601().withMessage('Valid inspection date is required'),
  body('officerName').notEmpty().withMessage('Officer name is required'),
];

const updateNotificationValidation = [
  body('companyName').optional().notEmpty().withMessage('Company name cannot be empty'),
  body('productName').optional().notEmpty().withMessage('Product name cannot be empty'),
  body('productId').optional().notEmpty().withMessage('Product ID cannot be empty'),
  body('batchNumber').optional().notEmpty().withMessage('Batch number cannot be empty'),
  body('violation').optional().notEmpty().withMessage('Violation description cannot be empty'),
  body('rule').optional().notEmpty().withMessage('Rule reference cannot be empty'),
  body('inspectionDate').optional().isISO8601().withMessage('Valid inspection date is required'),
  body('officerName').optional().notEmpty().withMessage('Officer name cannot be empty'),
  body('status')
    .optional()
    .isIn([
      'Pending Response',
      'Response Submitted',
      'Re-inspection Scheduled',
      'Compliant',
      'Violation Confirmed',
      'Case Closed',
    ])
    .withMessage('Invalid status value'),
];

router.post('/', createNotificationValidation, validate, createNotification);
router.get('/', getNotifications);
router.get('/:id', checkId, getNotification);
router.put('/:id', checkId, updateNotificationValidation, validate, updateNotification);

export default router;
