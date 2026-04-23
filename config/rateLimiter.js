const rateLimit = require("express-rate-limit");

// Global limiter — generous, protects against abusive scraping/floods
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: "Too many requests from this IP, please try again after 15 minutes.",
});

// Auth limiter — strict, guards against brute-force on login/signup
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: "Too many login attempts. Please try again after 15 minutes.",
});

module.exports = { globalLimiter, authLimiter };
