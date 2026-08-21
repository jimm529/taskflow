const createRateLimiter = ({ windowMs, maxRequests, message }) => {
  const buckets = new Map();

  return (req, res, next) => {
    const key = `${req.ip}:${req.baseUrl || req.originalUrl}`;
    const now = Date.now();
    const bucket = buckets.get(key);

    if (!bucket || now > bucket.resetAt) {
      buckets.set(key, {
        count: 1,
        resetAt: now + windowMs,
      });

      return next();
    }

    if (bucket.count >= maxRequests) {
      return res.status(429).json({
        success: false,
        message,
      });
    }

    bucket.count += 1;
    return next();
  };
};

const authRateLimit = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  maxRequests: 20,
  message: "Too many authentication requests. Please try again later.",
});

module.exports = {
  createRateLimiter,
  authRateLimit,
};
