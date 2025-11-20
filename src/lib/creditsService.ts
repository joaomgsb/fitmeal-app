import { doc, getDoc, setDoc, updateDoc, increment, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

export interface CreditTransaction {
  id: string;
  type: 'purchase' | 'consumption' | 'subscription' | 'refund';
  amount: number; // positivo para compra, negativo para consumo
  productId?: string; // ID do produto comprado
  planId?: string; // ID do plano gerado (para consumo)
  // Usamos string ISO em vez de serverTimestamp() dentro de arrays,
  // pois o Firestore não permite serverTimestamp() em campos de array.
  timestamp: string;
  description: string;
}

export interface Subscription {
  id: string;
  productId: string;
  status: 'active' | 'cancelled' | 'expired' | 'pending';
  startDate: any;
  endDate?: any;
  creditsPerPeriod: number;
  // Também armazenamos como string ISO
  lastRenewal?: string;
}

export interface UserCredits {
  credits: number;
  transactions: CreditTransaction[];
  subscriptions: Subscription[];
  lastUpdated: any;
}

/**
 * Obtém os créditos do usuário
 */
export async function getUserCredits(userId: string): Promise<UserCredits> {
  const creditsRef = doc(db, 'users', userId, 'credits', 'data');
  const creditsSnap = await getDoc(creditsRef);

  if (creditsSnap.exists()) {
    return creditsSnap.data() as UserCredits;
  }

  // Criar documento inicial com 0 créditos
  const initialCredits: UserCredits = {
    credits: 0,
    transactions: [],
    subscriptions: [],
    lastUpdated: serverTimestamp()
  };

  await setDoc(creditsRef, initialCredits);
  return initialCredits;
}

/**
 * Adiciona créditos ao usuário (após compra)
 */
export async function addCredits(
  userId: string,
  amount: number,
  productId: string,
  description: string
): Promise<void> {
  const creditsRef = doc(db, 'users', userId, 'credits', 'data');
  const creditsSnap = await getDoc(creditsRef);

  const transaction: CreditTransaction = {
    id: Date.now().toString(),
    type: 'purchase',
    amount,
    productId,
    // Usamos a data do cliente porque serverTimestamp() não é permitido em arrays
    timestamp: new Date().toISOString(),
    description
  };

  if (creditsSnap.exists()) {
    const currentData = creditsSnap.data() as UserCredits;
    await updateDoc(creditsRef, {
      credits: increment(amount),
      transactions: [...currentData.transactions, transaction],
      lastUpdated: serverTimestamp()
    });
  } else {
    await setDoc(creditsRef, {
      credits: amount,
      transactions: [transaction],
      subscriptions: [],
      lastUpdated: serverTimestamp()
    });
  }
}

/**
 * Consome créditos do usuário (ao gerar plano)
 */
export async function consumeCredit(
  userId: string,
  planId: string,
  description: string = 'Geração de plano personalizado'
): Promise<boolean> {
  const creditsRef = doc(db, 'users', userId, 'credits', 'data');
  const creditsSnap = await getDoc(creditsRef);

  if (!creditsSnap.exists()) {
    throw new Error('Usuário não possui registro de créditos');
  }

  const currentData = creditsSnap.data() as UserCredits;

  if (currentData.credits < 1) {
    return false; // Sem créditos suficientes
  }

  const transaction: CreditTransaction = {
    id: Date.now().toString(),
    type: 'consumption',
    amount: -1,
    planId,
    // Usamos a data do cliente porque serverTimestamp() não é permitido em arrays
    timestamp: new Date().toISOString(),
    description
  };

  await updateDoc(creditsRef, {
    credits: increment(-1),
    transactions: [...currentData.transactions, transaction],
    lastUpdated: serverTimestamp()
  });

  return true;
}

/**
 * Verifica se o usuário tem créditos suficientes
 */
export async function hasCredits(userId: string, required: number = 1): Promise<boolean> {
  const credits = await getUserCredits(userId);
  return credits.credits >= required;
}

/**
 * Adiciona assinatura ativa
 */
export async function addSubscription(
  userId: string,
  subscription: Subscription
): Promise<void> {
  const creditsRef = doc(db, 'users', userId, 'credits', 'data');
  const creditsSnap = await getDoc(creditsRef);

  if (creditsSnap.exists()) {
    const currentData = creditsSnap.data() as UserCredits;
    await updateDoc(creditsRef, {
      subscriptions: [...currentData.subscriptions, subscription],
      lastUpdated: serverTimestamp()
    });
  } else {
    await setDoc(creditsRef, {
      credits: 0,
      transactions: [],
      subscriptions: [subscription],
      lastUpdated: serverTimestamp()
    });
  }
}

/**
 * Atualiza status de assinatura
 */
export async function updateSubscriptionStatus(
  userId: string,
  subscriptionId: string,
  status: Subscription['status']
): Promise<void> {
  const creditsRef = doc(db, 'users', userId, 'credits', 'data');
  const creditsSnap = await getDoc(creditsRef);

  if (!creditsSnap.exists()) {
    throw new Error('Usuário não possui registro de créditos');
  }

  const currentData = creditsSnap.data() as UserCredits;
  const updatedSubscriptions = currentData.subscriptions.map(sub =>
    sub.id === subscriptionId ? { ...sub, status } : sub
  );

  await updateDoc(creditsRef, {
    subscriptions: updatedSubscriptions,
    lastUpdated: serverTimestamp()
  });
}

/**
 * Processa renovação de assinatura (adiciona créditos)
 */
export async function processSubscriptionRenewal(
  userId: string,
  subscriptionId: string,
  creditsAmount: number
): Promise<void> {
  const creditsRef = doc(db, 'users', userId, 'credits', 'data');
  const creditsSnap = await getDoc(creditsRef);

  if (!creditsSnap.exists()) {
    throw new Error('Usuário não possui registro de créditos');
  }

  const currentData = creditsSnap.data() as UserCredits;
  const subscription = currentData.subscriptions.find(sub => sub.id === subscriptionId);

  if (!subscription) {
    throw new Error('Assinatura não encontrada');
  }

  const transaction: CreditTransaction = {
    id: Date.now().toString(),
    type: 'subscription',
    amount: creditsAmount,
    productId: subscription.productId,
    // Usamos a data do cliente porque serverTimestamp() não é permitido em arrays
    timestamp: new Date().toISOString(),
    description: `Renovação de assinatura: ${subscription.productId}`
  };

  const updatedSubscriptions = currentData.subscriptions.map(sub =>
    sub.id === subscriptionId
      // Usamos a data do cliente porque serverTimestamp() não é permitido em arrays
      ? { ...sub, lastRenewal: new Date().toISOString() }
      : sub
  );

  await updateDoc(creditsRef, {
    credits: increment(creditsAmount),
    transactions: [...currentData.transactions, transaction],
    subscriptions: updatedSubscriptions,
    lastUpdated: serverTimestamp()
  });
}

/**
 * Exemplo de função de reprocessamento de créditos de assinaturas
 * (pode ser usada em um job ou função cloud no futuro)
 */
export async function reprocessAllSubscriptionsForUser(userId: string): Promise<void> {
  const creditsRef = doc(db, 'users', userId, 'credits', 'data');
  const creditsSnap = await getDoc(creditsRef);

  if (!creditsSnap.exists()) {
    return;
  }

  const currentData = creditsSnap.data() as UserCredits;

  // Aqui você poderia implementar uma lógica para verificar quais assinaturas
  // precisam ser renovadas e chamar processSubscriptionRenewal para cada uma.
  // Por enquanto, deixamos apenas a estrutura pronta.
}


