import { encrypt } from '../helpers/encryption';

type WokerArgs = {
  value: string | ArrayBuffer;
  encryptionKey: string;
  fileType: string;
  skip: boolean;
};

const onmessage = (event: MessageEvent<WokerArgs>) => {
  if (event.data.skip) {
    postMessage(event.data.value);
    return;
  }

  const valueBuffer = Buffer.from(event.data.value as string);
  const { encryptedBuffer } = encrypt(valueBuffer, event.data.encryptionKey);
  const encryptedBlob = new Blob([encryptedBuffer], {
    type: event.data.fileType,
  });

  postMessage(encryptedBlob);
};

addEventListener('message', onmessage);
