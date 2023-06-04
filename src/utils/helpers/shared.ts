export const getHumanReadableDate = (date: Date) =>
  date.toLocaleString('ro-RO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric' });
