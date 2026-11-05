const authMiddleware = require('./authMiddleware');
const verifyCallback = require('./verifyCallbackMiddleware');

/**
 * ABDM Route Guard
 *
 * Distinguishes ABDM Gateway callback routes (public, protected by verifyCallback)
 * from internal Medora360 routes (protected by hospital JWT via authMiddleware).
 *
 * Callback path prefixes: /v3/ and /api/v3/
 * Everything else under the ABDM webhook mount is treated as internal.
 */
const abdmRouteGuard = (req, res, next) => {
    // Health checks are always public
    if (req.path === '/health') {
        return next();
    }

    const isCallback =
        req.path.startsWith('/v3/') || req.path.startsWith('/api/v3/');

    if (isCallback) {
        return verifyCallback(req, res, next);
    }
    return authMiddleware(req, res, next);
};

module.exports = abdmRouteGuard;
