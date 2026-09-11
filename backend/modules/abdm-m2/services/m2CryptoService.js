const crypto = require('crypto');

// Standard ASN.1 SPKI header for X25519 public keys (12 bytes)
const X25519_SPKI_HEADER = Buffer.from('302a300506032b656e032100', 'hex');

/**
 * Helper to import a raw 32-byte or SPKI DER X25519 public key
 * 
 * @param {string|Buffer} pubKeyInput - Base64 string or Buffer of public key
 * @returns {crypto.KeyObject} Imported public KeyObject
 */
const importX25519PublicKey = (pubKeyInput) => {
    let keyBuf = Buffer.isBuffer(pubKeyInput) ? pubKeyInput : Buffer.from(pubKeyInput, 'base64');

    // If key has SPKI header (44 bytes), use directly
    if (keyBuf.length === 44) {
        return crypto.createPublicKey({
            key: keyBuf,
            format: 'der',
            type: 'spki'
        });
    }

    // If raw 32 bytes, prepend ASN.1 SPKI header
    if (keyBuf.length === 32) {
        const spkiDer = Buffer.concat([X25519_SPKI_HEADER, keyBuf]);
        return crypto.createPublicKey({
            key: spkiDer,
            format: 'der',
            type: 'spki'
        });
    }

    // If longer, extract the last 32 bytes
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
 * Calculate MD5 Checksum of payload string
 */
const calculateChecksum = (dataStr) => {
    return crypto.createHash('md5').update(dataStr, 'utf8').digest('hex');
};

/**
 * Encrypt stringified FHIR JSON payload using ABDM Fidelius (ECDH Curve25519 + HKDF-SHA256 + AES-256-GCM)
 * 
 * @param {string} stringifiedFhirPayload - Plain JSON string of FHIR bundle
 * @param {Object} receiverKeyMaterial - Recipient key material from ABDM HIU data request
 * @param {Object} receiverKeyMaterial.dhPublicKey - Recipient DH public key object
 * @param {string} receiverKeyMaterial.dhPublicKey.keyValue - Base64 string of recipient public key
 * @param {string} receiverKeyMaterial.nonce - Base64 string of recipient 32-byte nonce
 * @returns {Object} { encryptedData: string, checksum: string, keyMaterial: Object }
 */
const encryptData = (stringifiedFhirPayload, receiverKeyMaterial) => {
    try {
        if (!stringifiedFhirPayload) {
            throw new Error('stringifiedFhirPayload is required for encryption');
        }

        const receiverPubBase64 = receiverKeyMaterial?.dhPublicKey?.keyValue;
        const receiverNonceBase64 = receiverKeyMaterial?.nonce;

        if (!receiverPubBase64) {
            throw new Error('Receiver public key (dhPublicKey.keyValue) is missing');
        }
        if (!receiverNonceBase64) {
            throw new Error('Receiver nonce is missing');
        }

        // 1. Import Receiver Public Key
        const receiverPubKey = importX25519PublicKey(receiverPubBase64);
        const receiverNonce = Buffer.from(receiverNonceBase64, 'base64');

        // 2. Generate Ephemeral Sender Key Pair (X25519)
        const { publicKey: senderPub, privateKey: senderPriv } = crypto.generateKeyPairSync('x25519');
        const senderSpkiDer = senderPub.export({ type: 'spki', format: 'der' });
        const senderRawPub = senderSpkiDer.subarray(12); // Raw 32 bytes

        // 3. Generate Ephemeral 32-byte Nonce
        const senderNonce = crypto.randomBytes(32);

        // 4. Compute Shared Secret using ECDH
        const sharedSecret = crypto.diffieHellman({
            privateKey: senderPriv,
            publicKey: receiverPubKey
        });

        // 5. Compute XOR Salt between sender nonce and receiver nonce
        const salt = Buffer.alloc(32);
        for (let i = 0; i < 32; i++) {
            salt[i] = (senderNonce[i] || 0) ^ (receiverNonce[i] || 0);
        }

        // 6. Key & IV Derivation via HKDF-SHA256 (32 bytes AES Key + 12 bytes IV = 44 bytes)
        const derived = Buffer.from(crypto.hkdfSync('sha256', sharedSecret, salt, Buffer.alloc(0), 44));
        const aesKey = derived.subarray(0, 32);
        const iv = derived.subarray(32, 44);

        // 7. AES-256-GCM Encryption
        const cipher = crypto.createCipheriv('aes-256-gcm', aesKey, iv);
        let encrypted = cipher.update(stringifiedFhirPayload, 'utf8');
        encrypted = Buffer.concat([encrypted, cipher.final()]);
        const authTag = cipher.getAuthTag();

        // Concatenate ciphertext + 16-byte authentication tag
        const encryptedBuffer = Buffer.concat([encrypted, authTag]);
        const encryptedData = encryptedBuffer.toString('base64');

        // 8. Compute MD5 Checksum of Encrypted Data
        const checksum = calculateChecksum(encryptedData);

        // 9. Format Sender Key Material matching ABDM spec
        const keyMaterial = {
            cryptoAlg: 'ECDH',
            curve: 'Curve25519',
            dhPublicKey: {
                expiry: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
                parameters: 'Curve25519/32byte random key',
                keyValue: senderRawPub.toString('base64')
            },
            nonce: senderNonce.toString('base64')
        };

        return {
            encryptedData,
            checksum,
            keyMaterial
        };

    } catch (error) {
        console.error('❌ [ABDM-M2 Crypto] Encryption error:', error.message);
        throw error;
    }
};

module.exports = {
    importX25519PublicKey,
    calculateChecksum,
    encryptData
};
