export const formatCPF = (value: string) => {
  const cleaned = ('' + value).replace(/\D/g, '');
  let formatted = cleaned;
  if (cleaned.length > 9) {
    formatted = cleaned.replace(/^(\d{3})(\d{3})(\d{3})(\d{1,2}).*/, '$1.$2.$3-$4');
  } else if (cleaned.length > 6) {
    formatted = cleaned.replace(/^(\d{3})(\d{3})(\d{1,3}).*/, '$1.$2.$3');
  } else if (cleaned.length > 3) {
    formatted = cleaned.replace(/^(\d{3})(\d{1,3}).*/, '$1.$2');
  }
  return formatted;
};

export const formatPhone = (value: string) => {
  const cleaned = ('' + value).replace(/\D/g, '');
  let formatted = cleaned;
  if (cleaned.length > 10) {
    formatted = cleaned.replace(/^(\d{2})(\d{5})(\d{4}).*/, '($1) $2-$3');
  } else if (cleaned.length > 6) {
    formatted = cleaned.replace(/^(\d{2})(\d{4})(\d{0,4}).*/, '($1) $2-$3');
  } else if (cleaned.length > 2) {
    formatted = cleaned.replace(/^(\d{2})(\d{0,5}).*/, '($1) $2');
  }
  return formatted;
};

export const formatCurrency = (value: number) => {
  return `R$ ${value.toFixed(2).replace('.', ',')}`;
};
