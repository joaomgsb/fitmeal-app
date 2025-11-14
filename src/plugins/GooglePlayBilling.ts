import { registerPlugin } from '@capacitor/core';

export interface PurchaseResult {
  success: boolean;
  purchaseToken?: string;
  orderId?: string;
  productId?: string;
  error?: string;
}

export interface Product {
  id: string;
  title: string;
  description: string;
  price: string;
  priceAmountMicros: number;
  priceCurrencyCode: string;
  type: 'consumable' | 'subscription';
}

export interface GooglePlayBillingPlugin {
  /**
   * Inicializa a conexão com o Google Play Billing
   */
  initialize(): Promise<{ success: boolean; error?: string }>;

  /**
   * Obtém os produtos disponíveis para compra
   */
  getProducts(options: { productIds: string[] }): Promise<{ products: Product[]; error?: string }>;

  /**
   * Inicia o fluxo de compra de um produto
   */
  purchaseProduct(options: { productId: string }): Promise<PurchaseResult>;

  /**
   * Consome um produto comprado (para produtos consumíveis)
   */
  consumePurchase(options: { purchaseToken: string }): Promise<{ success: boolean; error?: string }>;

  /**
   * Obtém as assinaturas ativas do usuário
   */
  getActiveSubscriptions(): Promise<{ subscriptions: string[]; error?: string }>;

  /**
   * Verifica se uma compra está ativa
   */
  verifyPurchase(options: { purchaseToken: string }): Promise<{ isValid: boolean; error?: string }>;
}

const GooglePlayBilling = registerPlugin<GooglePlayBillingPlugin>('GooglePlayBilling', {
  web: () => import('./GooglePlayBilling.web').then(m => new m.GooglePlayBillingWeb()),
});

export default GooglePlayBilling;

