import jwt from 'jsonwebtoken';
import { AppError } from './errorHandler.js';

export const authMiddleware = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      throw new AppError('No token provided', 401);
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        throw new AppError('Token expired', 401);
      }
      throw new AppError('Invalid token', 401);
    }

    if (!decoded.userId || !decoded.role) {
      throw new AppError('Invalid token payload', 401);
    }

    req.user = decoded;
    next();
  } catch (err) {
    res.status(err.statusCode || 401).json({ success: false, message: err.message });
  }
};

export const adminMiddleware = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Admin access required' });
  }
  next();
};

export const generateTokens = (userId, role) => {
  if (!userId || !role) {
    throw new Error('userId and role are required to generate tokens');
  }

  const accessToken = jwt.sign(
    { userId, role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRY || '1h' }
  );

  const refreshToken = jwt.sign(
    { userId, role },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRY || '7d' }
  );

  return { accessToken, refreshToken };
};
