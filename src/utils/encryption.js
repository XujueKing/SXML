/**
 * Encryption Utilities
 * AES-GCM encryption with MD5 dynamic keys
 */

const crypto = require('crypto');

class EncryptionUtil {
  constructor(secretKey = 'default-secret-key') {
    this.secretKey = secretKey;
    this.algorithm = 'aes-256-gcm';
  }

  /**
   * Generate MD5 hash
   * @param {string} data - Data to hash
   * @returns {string} MD5 hash
   */
  md5(data) {
    return crypto.createHash('md5').update(data).digest('hex');
  }

  /**
   * Generate dynamic key based on timestamp and secret
   * @param {number} timestamp - Timestamp for key generation
   * @returns {Buffer} Dynamic key
   */
  generateDynamicKey(timestamp = Date.now()) {
    const timeKey = Math.floor(timestamp / 60000); // Change every minute
    const keyString = this.md5(`${this.secretKey}:${timeKey}`);
    // MD5 gives us 16 bytes, we need 32 bytes for AES-256
    // Use SHA-256 for proper 32-byte key
    return crypto.createHash('sha256')
      .update(`${this.secretKey}:${timeKey}`)
      .digest();
  }

  /**
   * Encrypt data using AES-256-GCM
   * @param {string|Object} data - Data to encrypt
   * @param {Buffer} key - Encryption key (optional, uses dynamic key if not provided)
   * @returns {Object} Encrypted data with IV and auth tag
   */
  encrypt(data, key = null) {
    const timestamp = Date.now();
    const encryptionKey = key || this.generateDynamicKey(timestamp);
    
    // Convert data to string if object
    const plaintext = typeof data === 'object' ? JSON.stringify(data) : String(data);
    
    // Generate random IV (12 bytes recommended for GCM)
    const iv = crypto.randomBytes(12);
    
    // Create cipher
    const cipher = crypto.createCipheriv(this.algorithm, encryptionKey, iv);
    
    // Encrypt
    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    // Get auth tag
    const authTag = cipher.getAuthTag();
    
    return {
      encrypted: encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex'),
      timestamp: timestamp
    };
  }

  /**
   * Decrypt data using AES-256-GCM
   * @param {Object} encryptedData - Encrypted data object
   * @param {Buffer} key - Decryption key (optional, uses dynamic key with timestamp if not provided)
   * @returns {string|Object} Decrypted data
   */
  decrypt(encryptedData, key = null) {
    const { encrypted, iv, authTag, timestamp } = encryptedData;
    const decryptionKey = key || this.generateDynamicKey(timestamp);
    
    // Create decipher
    const decipher = crypto.createDecipheriv(
      this.algorithm,
      decryptionKey,
      Buffer.from(iv, 'hex')
    );
    
    // Set auth tag
    decipher.setAuthTag(Buffer.from(authTag, 'hex'));
    
    // Decrypt
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    // Try to parse as JSON
    try {
      return JSON.parse(decrypted);
    } catch (e) {
      return decrypted;
    }
  }

  /**
   * Create encrypted API request
   * @param {Object} data - Request data
   * @returns {Object} Encrypted request object
   */
  encryptAPIRequest(data) {
    const encrypted = this.encrypt(data);
    return {
      payload: encrypted.encrypted,
      iv: encrypted.iv,
      tag: encrypted.authTag,
      ts: encrypted.timestamp
    };
  }

  /**
   * Decrypt API response
   * @param {Object} response - Encrypted response
   * @returns {Object} Decrypted response data
   */
  decryptAPIResponse(response) {
    return this.decrypt({
      encrypted: response.payload,
      iv: response.iv,
      authTag: response.tag,
      timestamp: response.ts
    });
  }

  /**
   * Generate signature for request verification
   * @param {Object} data - Request data
   * @param {string} secret - Secret key
   * @returns {string} Signature
   */
  sign(data, secret = this.secretKey) {
    const dataString = typeof data === 'object' ? JSON.stringify(data) : String(data);
    return crypto
      .createHmac('sha256', secret)
      .update(dataString)
      .digest('hex');
  }

  /**
   * Verify signature
   * @param {Object} data - Request data
   * @param {string} signature - Signature to verify
   * @param {string} secret - Secret key
   * @returns {boolean} Verification result
   */
  verify(data, signature, secret = this.secretKey) {
    const expectedSignature = this.sign(data, secret);
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  }
}

module.exports = EncryptionUtil;
