import { registerPlugin, Capacitor } from '@capacitor/core';

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
  initialize(): Promise<{ success: boolean; error?: string }>;
  getProducts(options: { products: { id: string; type: 'inapp' | 'subscription' }[] }): Promise<{ products: Product[]; error?: string }>;
  queryPurchases(options: { type: 'inapp' | 'subs' }): Promise<{ purchases: any[]; error?: string }>;
  purchaseProduct(options: { productId: string }): Promise<PurchaseResult>;
  consumePurchase(options: { purchaseToken: string }): Promise<{ success: boolean; error?: string }>;
  getActiveSubscriptions(): Promise<{ subscriptions: string[]; error?: string }>;
  verifyPurchase(options: { purchaseToken: string }): Promise<{ isValid: boolean; error?: string }>;
}

// Criar plugin apenas se estiver no Android para evitar erros
let nativePlugin: GooglePlayBillingPlugin | null = null;

try {
  if (Capacitor.getPlatform() === 'android') {
    nativePlugin = registerPlugin<GooglePlayBillingPlugin>('GooglePlayBilling');
  }
} catch (e) {
  console.warn('Erro ao registrar plugin GooglePlayBilling:', e);
}

// Wrapper seguro com fallbacks
const SafeGooglePlayBilling: GooglePlayBillingPlugin = {
  async initialize() {
    try {
      if (nativePlugin) {
        return await nativePlugin.initialize();
      }
      return { success: false, error: 'Plugin não disponível' };
    } catch (e) {
      console.warn('Erro ao inicializar billing:', e);
      return { success: false, error: String(e) };
    }
  },
  
  async getProducts(options) {
    try {
      if (nativePlugin) {
        return await nativePlugin.getProducts(options);
      }
      return { products: [], error: 'Plugin não disponível' };
    } catch (e) {
      console.warn('Erro ao buscar produtos:', e);
      return { products: [], error: String(e) };
    }
  },
  
  async queryPurchases(options) {
    try {
      if (nativePlugin) {
        return await nativePlugin.queryPurchases(options);
      }
      return { purchases: [], error: 'Plugin não disponível' };
    } catch (e) {
      console.warn('Erro ao consultar compras:', e);
      return { purchases: [], error: String(e) };
    }
  },
  
  async purchaseProduct(options) {
    try {
      if (nativePlugin) {
        return await nativePlugin.purchaseProduct(options);
      }
      return { success: false, error: 'Plugin não disponível' };
    } catch (e) {
      console.warn('Erro ao comprar produto:', e);
      return { success: false, error: String(e) };
    }
  },
  
  async consumePurchase(options) {
    try {
      if (nativePlugin) {
        return await nativePlugin.consumePurchase(options);
      }
      return { success: false, error: 'Plugin não disponível' };
    } catch (e) {
      console.warn('Erro ao consumir compra:', e);
      return { success: false, error: String(e) };
    }
  },
  
  async getActiveSubscriptions() {
    try {
      if (nativePlugin) {
        return await nativePlugin.getActiveSubscriptions();
      }
      return { subscriptions: [], error: 'Plugin não disponível' };
    } catch (e) {
      console.warn('Erro ao buscar assinaturas:', e);
      return { subscriptions: [], error: String(e) };
    }
  },
  
  async verifyPurchase(options) {
    try {
      if (nativePlugin) {
        return await nativePlugin.verifyPurchase(options);
      }
      return { isValid: false, error: 'Plugin não disponível' };
    } catch (e) {
      console.warn('Erro ao verificar compra:', e);
      return { isValid: false, error: String(e) };
    }
  }
};

export default SafeGooglePlayBilling;

