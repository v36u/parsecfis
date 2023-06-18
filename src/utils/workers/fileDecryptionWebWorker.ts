import { decrypt } from '../helpers/encryption';

type WokerArgs = {
  value: string | ArrayBuffer;
  decryptionKey: string;
  fileType: string;
  skip: boolean;
};

const onmessage = (event: MessageEvent<WokerArgs>) => {
  if (event.data.skip) {
    postMessage(event.data.value);
    return;
  }

  const valueBuffer = Buffer.from(event.data.value as string);
  const { decryptedBuffer } = decrypt(valueBuffer, event.data.decryptionKey);
  const decryptedBlob = new Blob([decryptedBuffer], {
    type: event.data.fileType,
  });

  postMessage(decryptedBlob);
};

addEventListener('message', onmessage);
