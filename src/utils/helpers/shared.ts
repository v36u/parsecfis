export const getHumanReadableDate = (date: Date) =>
  date.toLocaleString('ro-RO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric' });

export const getBufferFromReaderResult = (result: string | ArrayBuffer) =>
  typeof result === 'string' ? Buffer.from(result) : Buffer.from(new Uint8Array(result));
