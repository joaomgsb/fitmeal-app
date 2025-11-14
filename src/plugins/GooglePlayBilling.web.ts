import { WebPlugin } from '@capacitor/core';
import type { GooglePlayBillingPlugin, PurchaseResult, Product } from './GooglePlayBilling';

export class GooglePlayBillingWeb extends WebPlugin implements GooglePlayBillingPlugin {
  async initialize(): Promise<{ success: boolean; error?: string }> {
    return {
      success: false,
      error: 'Google Play Billing não está disponível na web'
    };
  }

  async getProducts(options: { productIds: string[] }): Promise<{ products: Product[]; error?: string }> {
    return {
      products: [],
      error: 'Google Play Billing não está disponível na web'
    };
  }

  async purchaseProduct(options: { productId: string }): Promise<PurchaseResult> {
    return {
      success: false,
      error: 'Google Play Billing não está disponível na web'
    };
  }

  async consumePurchase(options: { purchaseToken: string }): Promise<{ success: boolean; error?: string }> {
    return {
      success: false,
      error: 'Google Play Billing não está disponível na web'
    };
  }

  async getActiveSubscriptions(): Promise<{ subscriptions: string[]; error?: string }> {
    return {
      subscriptions: [],
      error: 'Google Play Billing não está disponível na web'
    };
  }

  async verifyPurchase(options: { purchaseToken: string }): Promise<{ isValid: boolean; error?: string }> {
    return {
      isValid: false,
      error: 'Google Play Billing não está disponível na web'
    };
  }
}
