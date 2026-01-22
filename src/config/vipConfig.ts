/**
 * Configurações do sistema VIP de indicações
 * 
 * PARA TESTE: Use os valores de teste comentados
 * PARA PRODUÇÃO: Use os valores de produção
 */

// ============================================
// VALORES DE TESTE (5 minutos, 2 indicações)
// ============================================
// export const VIP_COOLDOWN_MS = 5 * 60 * 1000; // 5 minutos em milissegundos
// export const REQUIRED_REFERRALS = 2; // 2 indicações para teste

// ============================================
// VALORES DE PRODUÇÃO (1 semana, 10 indicações)
// Descomente estas linhas e comente as de cima quando for para produção
// ============================================
 export const VIP_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000; // 1 semana em milissegundos
 export const REQUIRED_REFERRALS = 10; // 10 indicações para produção

/**
 * Verifica se o cooldown do VIP já passou
 * @param lastVipUsedAt - Timestamp ISO de quando o VIP foi usado pela última vez
 * @returns true se o cooldown passou ou se nunca usou o VIP
 */
export function isVipCooldownOver(lastVipUsedAt: string | null | undefined): boolean {
  if (!lastVipUsedAt) return true; // Nunca usou, pode acumular indicações
  
  const lastUsed = new Date(lastVipUsedAt).getTime();
  const now = Date.now();
  
  return (now - lastUsed) >= VIP_COOLDOWN_MS;
}

/**
 * Calcula quanto tempo falta para o cooldown acabar
 * @param lastVipUsedAt - Timestamp ISO de quando o VIP foi usado pela última vez
 * @returns Objeto com informações do tempo restante
 */
export function getCooldownRemaining(lastVipUsedAt: string | null | undefined): {
  isOver: boolean;
  remainingMs: number;
  remainingText: string;
} {
  if (!lastVipUsedAt) {
    return { isOver: true, remainingMs: 0, remainingText: '' };
  }
  
  const lastUsed = new Date(lastVipUsedAt).getTime();
  const now = Date.now();
  const elapsed = now - lastUsed;
  const remaining = VIP_COOLDOWN_MS - elapsed;
  
  if (remaining <= 0) {
    return { isOver: true, remainingMs: 0, remainingText: '' };
  }
  
  // Formatar texto de tempo restante
  const minutes = Math.floor(remaining / (60 * 1000));
  const hours = Math.floor(remaining / (60 * 60 * 1000));
  const days = Math.floor(remaining / (24 * 60 * 60 * 1000));
  
  let remainingText: string;
  if (days > 0) {
    remainingText = `${days} dia${days > 1 ? 's' : ''}`;
  } else if (hours > 0) {
    remainingText = `${hours} hora${hours > 1 ? 's' : ''}`;
  } else {
    remainingText = `${minutes} minuto${minutes > 1 ? 's' : ''}`;
  }
  
  return { isOver: false, remainingMs: remaining, remainingText };
}

/**
 * Verifica se o usuário é VIP (pode usar o bônus)
 * @param hasDiscount - Flag hasDiscount do usuário
 * @param referralCount - Número de indicações do usuário
 * @returns true se o usuário é VIP
 */
export function isUserVip(hasDiscount: boolean | undefined, referralCount: number | undefined): boolean {
  return hasDiscount === true || (referralCount || 0) >= REQUIRED_REFERRALS;
}

