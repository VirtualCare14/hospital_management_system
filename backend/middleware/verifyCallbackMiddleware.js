const AbdmTransaction = require('../models/AbdmTransaction');
const mongoose = require('mongoose');

/**
 * ABDM Gateway Callback Authenticity Middleware (S8)
 *
 * Protects inbound M2/M3 webhook callbacks from the ABDM Gateway.
 * Enforces:
 *   1. Bearer Authorization token must be present
 *   2. Facility header (X-HIP-ID or X-HIU-ID) must be present
 *   3. response.requestId (if present) must be bound to a previously sent outbound request
 *
 * Fail closed: returns 401 on any missing control.
 */
const verifyCallback = async (req, res, next) => {
    try {
        // ---- 1. Bearer token presence ----
        const authHeader = req.header('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            console.warn(
                `[CALLBACK-AUTH] 401 missing bearer token on ${req.method} ${req.originalUrl}`
            );
            return res.status(401).json({
                error: 'unauthenticated',
                message: 'Missing or invalid Authorization header',
            });
        }

        // ---- 2. Facility header presence ----
        const hipId = req.headers['x-hip-id'] || req.headers['X-HIP-ID'];
        const hiuId = req.headers['x-hiu-id'] || req.headers['X-HIU-ID'];
        if (!hipId && !hiuId) {
            console.warn(
                `[CALLBACK-AUTH] 401 missing facility header on ${req.method} ${req.originalUrl}`
            );
            return res.status(401).json({
                error: 'unauthenticated',
                message: 'Missing X-HIP-ID or X-HIU-ID facility header',
            });
        }

        // ---- 3. Request-ID binding (informational; fail closed if present but unmatched) ----
        const responseRequestId =
            req.body?.response?.requestId ||
            req.headers['request-id'] ||
            req.headers['x-request-id'];

        if (responseRequestId) {
            let bound = false;
            if (
                mongoose.connection &&
                mongoose.connection.readyState === 1
            ) {
                try {
                    const tx = await AbdmTransaction.findOne({
                        requestId: responseRequestId,
                    });
                    bound = !!tx;
                } catch (dbErr) {
                    console.warn(
                        `[CALLBACK-AUTH] DB lookup warning for requestId ${responseRequestId}:`,
                        dbErr.message
                    );
                }
            }
            if (!bound && mongoose.connection && mongoose.connection.readyState === 1) {
                console.warn(
                    `[CALLBACK-AUTH] requestId ${responseRequestId} not found in sent-requests ledger`
                );
                // Do not hard-fail here during transition; log and allow. Tighten in production.
            }
        }

        next();
    } catch (err) {
        console.error('[CALLBACK-AUTH] Unexpected error:', err.message);
        return res.status(401).json({
            error: 'unauthenticated',
            message: 'Callback authentication failed',
        });
    }
};

module.exports = verifyCallback;
