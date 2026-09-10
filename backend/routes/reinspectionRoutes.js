import { Router } from 'express';
import { body } from 'express-validator';
import validate from '../middleware/validate.js';
import { checkObjectIdParam } from '../middleware/objectId.js';
import {
  createReinspection,
  getReinspectionsByNotification,
  getReinspection,
  updateReinspection,
} from '../controllers/reinspectionController.js';

const router = Router();
const checkNotificationId = checkObjectIdParam('notificationId');
const checkId = checkObjectIdParam('id');

const createReinspectionValidation = [
  body('notificationId')
    .notEmpty()
    .withMessage('Notification ID is required')
    .isMongoId()
    .withMessage('Notification ID must be a valid ObjectId'),
  body('companyName').notEmpty().withMessage('Company name is required'),
  body('productName').notEmpty().withMessage('Product name is required'),
  body('previousViolation').notEmpty().withMessage('Previous violation is required'),
  body('responseId')
    .optional({ values: 'falsy' })
    .isMongoId()
    .withMessage('Response ID must be a valid ObjectId'),
  body('reInspectionDate').isISO8601().withMessage('Valid re-inspection date is required'),
  body('officerName').notEmpty().withMessage('Officer name is required'),
  body('inspectionResult')
    .isIn(['Compliant', 'Still Violated'])
    .withMessage('Inspection result must be either Compliant or Still Violated'),
];

const updateReinspectionValidation = [
  body('companyName').optional().notEmpty().withMessage('Company name cannot be empty'),
  body('productName').optional().notEmpty().withMessage('Product name cannot be empty'),
  body('previousViolation').optional().notEmpty().withMessage('Previous violation cannot be empty'),
  body('responseId')
    .optional({ values: 'falsy' })
    .isMongoId()
    .withMessage('Response ID must be a valid ObjectId'),
  body('reInspectionDate').optional().isISO8601().withMessage('Valid re-inspection date is required'),
  body('officerName').optional().notEmpty().withMessage('Officer name cannot be empty'),
  body('inspectionResult')
    .optional()
    .isIn(['Compliant', 'Still Violated'])
    .withMessage('Inspection result must be either Compliant or Still Violated'),
  body('remarks').optional().isString(),
];

router.post('/', createReinspectionValidation, validate, createReinspection);
router.get('/notification/:notificationId', checkNotificationId, getReinspectionsByNotification);
router.get('/:id', checkId, getReinspection);
router.put('/:id', checkId, updateReinspectionValidation, validate, updateReinspection);

export default router;
