import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';
import invariant from 'tiny-invariant';

const ivSeparator = '~' as const;

export const encrypt = (text: string, key: string) => {
  const keyBuffer = Buffer.from(key, 'hex');
  const iv = randomBytes(16);
  const cipher = createCipheriv('aes-256-cbc', keyBuffer, iv);

  let encryptedTextBuffer = cipher.update(text);
  encryptedTextBuffer = Buffer.concat([encryptedTextBuffer, cipher.final()]);

  return `${iv.toString('hex')}${ivSeparator}${encryptedTextBuffer.toString('hex')}`;
};

export const decrypt = (text: string, key: string) => {
  const keyBuffer = Buffer.from(key, 'hex');
  const [iv, encryptedTextBuffer] = text.split(ivSeparator).map((v) => Buffer.from(v, 'hex'));
  invariant(iv && encryptedTextBuffer, 'Date incomplete pentru a realiza decriptarea.');
  const decipher = createDecipheriv('aes-256-cbc', keyBuffer, iv);

  let decryptedTextBuffer = decipher.update(encryptedTextBuffer);
  decryptedTextBuffer = Buffer.concat([decryptedTextBuffer, decipher.final()]);

  return decryptedTextBuffer;
};
