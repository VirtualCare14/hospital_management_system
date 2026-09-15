const crypto = require('crypto');

// Standard ASN.1 SPKI header for X25519 public keys (12 bytes)
const X25519_SPKI_HEADER = Buffer.from('302a300506032b656e032100', 'hex');

// Standard ASN.1 PKCS#8 header for X25519 private keys (16 bytes)
const X25519_PKCS8_HEADER = Buffer.from('302e020100300506032b656e04220420', 'hex');

/**
 * Helper to import raw 32-byte or SPKI DER X25519 public key
 * 
 * @param {string|Buffer} pubKeyInput - Base64 string or Buffer of public key
 * @returns {crypto.KeyObject} Imported public KeyObject
 */
const importX25519PublicKey = (pubKeyInput) => {
    let keyBuf = Buffer.isBuffer(pubKeyInput) ? pubKeyInput : Buffer.from(pubKeyInput, 'base64');

    if (keyBuf.length === 44) {
        return crypto.createPublicKey({
            key: keyBuf,
            format: 'der',
            type: 'spki'
        });
    }

    if (keyBuf.length === 32) {
        const spkiDer = Buffer.concat([X25519_SPKI_HEADER, keyBuf]);
        return crypto.createPublicKey({
            key: spkiDer,
            format: 'der',
            type: 'spki'
        });
    }

    if (keyBuf.length > 32) {
        const raw32 = keyBuf.subarray(keyBuf.length - 32);
        const spkiDer = Buffer.concat([X25519_SPKI_HEADER, raw32]);
        return crypto.createPublicKey({
            key: spkiDer,
            format: 'der',
            type: 'spki'
        });
    }

    throw new Error(`Invalid X25519 public key length: ${keyBuf.length} bytes (expected 32 or 44 bytes)`);
};

/**
 * Helper to import raw 32-byte or PKCS#8 DER X25519 private key
 * 
 * @param {string|Buffer} privKeyInput - Base64 string or Buffer of private key
 * @returns {crypto.KeyObject} Imported private KeyObject
 */
const importX25519PrivateKey = (privKeyInput) => {
    let keyBuf = Buffer.isBuffer(privKeyInput) ? privKeyInput : Buffer.from(privKeyInput, 'base64');

    if (keyBuf.length === 48) {
        return crypto.createPrivateKey({
            key: keyBuf,
            format: 'der',
            type: 'pkcs8'
        });
    }

    if (keyBuf.length === 32) {
        const pkcs8Der = Buffer.concat([X25519_PKCS8_HEADER, keyBuf]);
        return crypto.createPrivateKey({
            key: pkcs8Der,
            format: 'der',
            type: 'pkcs8'
        });
    }

    if (keyBuf.length > 32) {
        const raw32 = keyBuf.subarray(keyBuf.length - 32);
        const pkcs8Der = Buffer.concat([X25519_PKCS8_HEADER, raw32]);
        return crypto.createPrivateKey({
            key: pkcs8Der,
            format: 'der',
            type: 'pkcs8'
        });
    }

    throw new Error(`Invalid X25519 private key length: ${keyBuf.length} bytes (expected 32 or 48 bytes)`);
};

/**
 * Calculate MD5 checksum
 */
const calculateChecksum = (dataStr) => {
    return crypto.createHash('md5').update(dataStr, 'utf8').digest('hex');
};

/**
 * Decrypt encrypted FHIR payload using ABDM Fidelius specifications (ECDH Curve25519 + HKDF-SHA256 + AES-256-GCM)
 * 
 * @param {string} encryptedBase64 - Base64 string of ciphertext + authTag
 * @param {string} receiverPrivateKeyBase64 - HIU's ephemeral private key (Base64)
 * @param {string} receiverNonceBase64 - HIU's ephemeral 32-byte nonce (Base64)
 * @param {string} senderPublicKeyBase64 - Remote HIP's ephemeral public key (Base64)
 * @param {string} senderNonceBase64 - Remote HIP's ephemeral 32-byte nonce (Base64)
 * @returns {string} Decrypted stringified FHIR JSON payload
 */
const decryptData = (
    encryptedBase64,
    receiverPrivateKeyBase64,
    receiverNonceBase64,
    senderPublicKeyBase64,
    senderNonceBase64
) => {
    try {
        if (!encryptedBase64) {
            throw new Error('encryptedBase64 is required for decryption');
        }
        if (!receiverPrivateKeyBase64) {
            throw new Error('receiverPrivateKeyBase64 is required for decryption');
        }
        if (!receiverNonceBase64) {
            throw new Error('receiverNonceBase64 is required for decryption');
        }
        if (!senderPublicKeyBase64) {
            throw new Error('senderPublicKeyBase64 is required for decryption');
        }
        if (!senderNonceBase64) {
            throw new Error('senderNonceBase64 is required for decryption');
        }

        // 1. Convert keys & nonces to KeyObjects / Buffers
        const receiverPrivKey = importX25519PrivateKey(receiverPrivateKeyBase64);
        const senderPubKey = importX25519PublicKey(senderPublicKeyBase64);
        const receiverNonce = Buffer.from(receiverNonceBase64, 'base64');
        const senderNonce = Buffer.from(senderNonceBase64, 'base64');

        // 2. Compute Shared Secret using ECDH
        const sharedSecret = crypto.diffieHellman({
            privateKey: receiverPrivKey,
            publicKey: senderPubKey
        });

        // 3. Compute 32-byte XOR Salt: senderNonce XOR receiverNonce
        const salt = Buffer.alloc(32);
        for (let i = 0; i < 32; i++) {
            salt[i] = (senderNonce[i] || 0) ^ (receiverNonce[i] || 0);
        }

        // 4. Key & IV Derivation via HKDF-SHA256 (32 bytes AES Key + 12 bytes IV = 44 bytes)
        const derived = Buffer.from(crypto.hkdfSync('sha256', sharedSecret, salt, Buffer.alloc(0), 44));
        const aesKey = derived.subarray(0, 32);
        const hkdfIv = derived.subarray(32, 44);

        // 5. Decode Encrypted Buffer (Ciphertext + 16-byte AuthTag)
        const encryptedBuffer = Buffer.from(encryptedBase64, 'base64');
        if (encryptedBuffer.length < 16) {
            throw new Error(`Encrypted buffer too short (${encryptedBuffer.length} bytes, minimum 16 bytes auth tag required)`);
        }

        const authTag = encryptedBuffer.subarray(encryptedBuffer.length - 16);
        const cipherText = encryptedBuffer.subarray(0, encryptedBuffer.length - 16);

        // 6. Decrypt using AES-256-GCM
        try {
            const decipher = crypto.createDecipheriv('aes-256-gcm', aesKey, hkdfIv);
            decipher.setAuthTag(authTag);
            let decrypted = decipher.update(cipherText, null, 'utf8');
            decrypted += decipher.final('utf8');
            return decrypted;
        } catch (decipherErr) {
            // Check if IV was prepended in the ciphertext (12-byte IV + ciphertext + 16-byte authTag)
            if (cipherText.length > 12) {
                try {
                    const prependedIv = cipherText.subarray(0, 12);
                    const actualCipherText = cipherText.subarray(12);
                    const decipher2 = crypto.createDecipheriv('aes-256-gcm', aesKey, prependedIv);
                    decipher2.setAuthTag(authTag);
                    let decrypted2 = decipher2.update(actualCipherText, null, 'utf8');
                    decrypted2 += decipher2.final('utf8');
                    return decrypted2;
                } catch (fallbackErr) {
                    throw decipherErr;
                }
            }
            throw decipherErr;
        }
    } catch (error) {
        console.error('❌ [ABDM-M3 Crypto] Decryption error:', error.message);
        throw error;
    }
};

module.exports = {
    importX25519PublicKey,
    importX25519PrivateKey,
    calculateChecksum,
    decryptData
};
