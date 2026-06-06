export const formatCurrency = (amount) => {
  if (amount === null || amount === undefined) return '৳0';
  return `৳${Number(amount).toLocaleString('en-BD', { maximumFractionDigits: 0 })}`;
};

export const formatCurrencyFull = (amount) => {
  if (amount === null || amount === undefined) return '৳0.00';
  return `৳${Number(amount).toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};
