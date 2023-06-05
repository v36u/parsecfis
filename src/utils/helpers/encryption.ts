import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ivBytes = 32;

/**
 * Encrypts a string or a buffer
 */
export const encrypt = (value: string | Buffer, key: string) => {
  const buffer = typeof value === 'string' ? Buffer.from(value) : value;

  const iv = randomBytes(ivBytes);
  const keyBuffer = Buffer.from(key, 'hex');
  const cipher = createCipheriv('aes-256-cbc', keyBuffer, iv);

  let encryptedBuffer = cipher.update(buffer);
  encryptedBuffer = Buffer.concat([iv, encryptedBuffer, cipher.final()]);

  return { encryptedBuffer };
};

/**
 * Decrypts a hex-encoded string or a buffer
 */
export const decrypt = (value: string | Buffer, key: string) => {
  const buffer = typeof value === 'string' ? Buffer.from(value, 'hex') : value;

  const keyBuffer = Buffer.from(key, 'hex');
  const iv = buffer.subarray(0, ivBytes);
  const decipher = createDecipheriv('aes-256-cbc', keyBuffer, iv);

  const encryptedBuffer = buffer.subarray(ivBytes);
  let decryptedBuffer = decipher.update(encryptedBuffer);
  decryptedBuffer = Buffer.concat([decryptedBuffer, decipher.final()]);

  return { decryptedBuffer, iv };
};
