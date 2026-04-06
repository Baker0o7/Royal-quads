export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') return '';
  return input
    .replace(/[<>]/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '')
    .trim();
}

export function sanitizeHTML(input: string): string {
  const div = document.createElement('div');
  div.textContent = input;
  return div.innerHTML;
}

export function validatePhone(phone: string): boolean {
  const cleaned = phone.replace(/[\s\-().]+/g, '');
  return /^254[1-9]\d{8}$/.test(cleaned) || /^[1-9]\d{9}$/.test(cleaned);
}

export function validatePromoCode(code: string): boolean {
  return /^[A-Z0-9]{3,10}$/.test(code.toUpperCase());
}
