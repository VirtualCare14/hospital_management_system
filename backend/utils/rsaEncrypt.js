const crypto = require("crypto");

/**
 * Encrypt text using ABDM Public Key
 * Algorithm:
 * RSA/ECB/OAEPWithSHA-1AndMGF1Padding
 */
const encrypt = (plainText, publicKey) => {

    // Convert Base64 Public Key to PEM
    const pemKey = [
        "-----BEGIN PUBLIC KEY-----",
        publicKey.match(/.{1,64}/g).join("\n"),
        "-----END PUBLIC KEY-----"
    ].join("\n");

    const encryptedBuffer = crypto.publicEncrypt(
        {
            key: pemKey,
            padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
            oaepHash: "sha1"
        },
        Buffer.from(plainText, "utf8")
    );

    return encryptedBuffer.toString("base64");
};

module.exports = {
    encrypt
};