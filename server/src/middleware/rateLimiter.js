import rateLimit from 'express-rate-limit';

// General API rate limiter
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests, please try again later.',
    retryAfter: 15
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Auth endpoints - stricter limits to prevent brute force
export const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 attempts per hour for login/signup
  message: {
    error: 'Too many authentication attempts. Please try again in an hour.',
    retryAfter: 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true // Don't count successful logins
});

// Password reset - very strict
export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 password reset requests per hour
  message: {
    error: 'Too many password reset requests. Please try again later.',
    retryAfter: 60
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Ticket purchase - prevent abuse
export const purchaseLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 purchases per minute
  message: {
    error: 'Too many purchase attempts. Please slow down.',
    retryAfter: 1
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Email sending - prevent spam
export const emailLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 emails per hour (broadcasts, verification requests)
  message: {
    error: 'Email limit reached. Please try again later.',
    retryAfter: 60
  },
  standardHeaders: true,
  legacyHeaders: false
});

// File upload limiter
export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // 20 uploads per hour
  message: {
    error: 'Upload limit reached. Please try again later.',
    retryAfter: 60
  },
  standardHeaders: true,
  legacyHeaders: false
});

export default {
  apiLimiter,
  authLimiter,
  passwordResetLimiter,
  purchaseLimiter,
  emailLimiter,
  uploadLimiter
};
