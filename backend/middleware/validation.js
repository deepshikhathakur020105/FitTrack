import { body, validationResult } from 'express-validator';
import { AppError } from './errorHandler.js';

export const validate = (validations) => async (req, res, next) => {
  for (let validation of validations) {
    const result = await validation.run(req);
    if (!result.isEmpty()) break;
  }

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError(errors.array()[0].msg, 400);
  }
  next();
};

export const signupValidations = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Invalid email address'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('goal').optional().trim()
];

export const loginValidations = [
  body('email').isEmail().withMessage('Invalid email address'),
  body('password').notEmpty().withMessage('Password is required')
];

export const resetPasswordValidations = [
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
];
