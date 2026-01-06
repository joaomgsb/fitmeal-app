/**
 * Gera um código de indicação aleatório de 8 caracteres
 */
export const generateReferralCode = (name: string): string => {
  const prefix = name.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, 'FIT');
  const randomChars = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `${prefix}${randomChars}`;
};

