import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ivBytes = 16;

/**
 * Encrypts a string or a buffer
 */
export const encrypt = (input: string | Buffer, key: string) => {
  const inputBuffer = typeof input === 'string' ? Buffer.from(input) : input;

  const iv = randomBytes(ivBytes);
  const keyBuffer = Buffer.from(key, 'hex');
  const cipher = createCipheriv('aes-256-cbc', keyBuffer, iv);

  let encryptedInputBuffer = cipher.update(inputBuffer);
  encryptedInputBuffer = Buffer.concat([iv, encryptedInputBuffer, cipher.final()]);

  return encryptedInputBuffer;
};

/**
 * Decrypts a hex-encoded string or a buffer
 */
export const decrypt = (input: string | Buffer, key: string) => {
  const inputBuffer = typeof input === 'string' ? Buffer.from(input, 'hex') : input;

  const keyBuffer = Buffer.from(key, 'hex');
  const iv = inputBuffer.subarray(0, ivBytes);
  const decipher = createDecipheriv('aes-256-cbc', keyBuffer, iv);

  const encryptedInputBuffer = inputBuffer.subarray(ivBytes);
  let decryptedTextBuffer = decipher.update(encryptedInputBuffer);
  decryptedTextBuffer = Buffer.concat([decryptedTextBuffer, decipher.final()]);

  return decryptedTextBuffer;
};
