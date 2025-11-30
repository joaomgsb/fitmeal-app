import { Capacitor } from '@capacitor/core';
import { Platform } from '@capacitor/core';
import GooglePlayBilling from '../plugins/GooglePlayBilling';

// IDs dos produtos no Google Play Console
export const PRODUCT_IDS = {
  // Recargas (produtos consumíveis)
  RECHARGE_1X: 'recharge_1x',
  RECHARGE_3X: 'recharge_3x',
  RECHARGE_5X: 'recharge_5x',
  
  // Assinaturas
  SUBSCRIPTION_BASIC: 'subscription_basic', // 5 créditos/mês
  SUBSCRIPTION_STANDARD: 'subscription_standard', // 7 créditos/mês
  SUBSCRIPTION_PREMIUM: 'subscription_premium', // 10 créditos/mês
} as const;

export interface BillingProduct {
  id: string;
  type: 'consumable' | 'subscription';
  title: string;
  description: string;
  price: string;
  credits: number;
  originalPrice?: string;
  discount?: string;
}

export const BILLING_PRODUCTS: BillingProduct[] = [
  {
    id: PRODUCT_IDS.RECHARGE_1X,
    type: 'consumable',
    title: 'Recarga 1x',
    description: '1 crédito para gerar 1 plano personalizado',
    price: 'R$ 2,99',
    credits: 1
  },
  {
    id: PRODUCT_IDS.RECHARGE_3X,
    type: 'consumable',
    title: 'Recarga 3x',
    description: '3 créditos para gerar 3 planos personalizados',
    price: 'R$ 7,99',
    credits: 3
  },
  {
    id: PRODUCT_IDS.RECHARGE_5X,
    type: 'consumable',
    title: 'Recarga 5x',
    description: '5 créditos para gerar 5 planos personalizados',
    price: 'R$ 13,99',
    credits: 5
  },
  {
    id: PRODUCT_IDS.SUBSCRIPTION_BASIC,
    type: 'subscription',
    title: 'Assinatura Basic',
    description: '5 créditos por mês',
    price: 'R$ 17,99',
    credits: 5
  },
  {
    id: PRODUCT_IDS.SUBSCRIPTION_STANDARD,
    type: 'subscription',
    title: 'Assinatura Standard',
    description: '7 créditos por mês',
    price: 'R$ 24,99',
    credits: 7
  },
  {
    id: PRODUCT_IDS.SUBSCRIPTION_PREMIUM,
    type: 'subscription',
    title: 'Assinatura Premium',
    description: '10 créditos por mês',
    price: 'R$ 34,99',
    credits: 10
  }
];

/**
 * Verifica se o dispositivo suporta billing
 */
export function isBillingAvailable(): boolean {
  return Capacitor.getPlatform() === 'android';
}

/**
 * Verifica e consome compras pendentes
 */
async function checkUnconsumedPurchases() {
  if (!isBillingAvailable()) return;
  
  try {
    // Consultar compras INAPP (consumíveis)
    const result = await GooglePlayBilling.queryPurchases({ type: 'inapp' });
    
    if (result.purchases && result.purchases.length > 0) {
      console.log('Encontradas compras não consumidas:', result.purchases.length);
      
      for (const purchase of result.purchases) {
        // Verificar se é um produto consumível nosso
        const product = BILLING_PRODUCTS.find(p => p.id === purchase.productId);
        
        if (product && product.type === 'consumable') {
          console.log(`Consumindo compra pendente: ${purchase.productId}`);
          await GooglePlayBilling.consumePurchase({ purchaseToken: purchase.purchaseToken });
        }
      }
    }
  } catch (error) {
    console.error('Erro ao verificar compras não consumidas:', error);
  }
}

/**
 * Inicializa o serviço de billing
 */
export async function initializeBilling(): Promise<void> {
  if (!isBillingAvailable()) {
    console.warn('Billing não está disponível nesta plataforma');
    return;
  }

  try {
    const result = await GooglePlayBilling.initialize();
    if (!result.success) {
      console.error('Erro ao inicializar billing:', result.error);
    } else {
      // Verificar compras pendentes após inicialização
      await checkUnconsumedPurchases();
    }
  } catch (error) {
    console.error('Erro ao inicializar Google Play Billing:', error);
  }
}

/**
 * Obtém os produtos disponíveis para compra
 */
export async function getAvailableProducts(): Promise<BillingProduct[]> {
  if (!isBillingAvailable()) {
    return BILLING_PRODUCTS; // Retorna produtos estáticos em desenvolvimento
  }

  try {
    // Passar lista completa com tipos para o plugin
    const productsRequest = BILLING_PRODUCTS.map(p => ({
      id: p.id,
      type: p.type
    }));
    
    const result = await GooglePlayBilling.getProducts({ products: productsRequest });
    
    if (result.products && result.products.length > 0) {
      // Mapear produtos do Google Play para nosso formato
      return result.products.map(product => {
        const staticProduct = BILLING_PRODUCTS.find(p => p.id === product.id);
        return {
          ...staticProduct!,
          price: product.price,
          // Manter outros dados do produto estático
        };
      });
    }
  } catch (error) {
    console.error('Erro ao buscar produtos:', error);
  }

  return BILLING_PRODUCTS; // Fallback para produtos estáticos
}

/**
 * Inicia o fluxo de compra de um produto
 */
export async function purchaseProduct(productId: string): Promise<{
  success: boolean;
  purchaseToken?: string;
  orderId?: string;
  error?: string;
  productId?: string;
}> {
  if (!isBillingAvailable()) {
    return {
      success: false,
      error: 'Billing não está disponível nesta plataforma'
    };
  }

  try {
    const product = BILLING_PRODUCTS.find(p => p.id === productId);
    if (!product) {
      return {
        success: false,
        error: 'Produto não encontrado'
      };
    }

    const result = await GooglePlayBilling.purchaseProduct({ 
      productId,
      type: product.type 
    });
    
    if (result.success && result.purchaseToken) {
      // Para produtos consumíveis, consumir imediatamente
      if (product.type === 'consumable') {
        await GooglePlayBilling.consumePurchase({ purchaseToken: result.purchaseToken });
      }
      
      return {
        success: true,
        purchaseToken: result.purchaseToken,
        orderId: result.orderId,
        productId: result.productId || productId
      };
    }
    
    // Tratamento para erro "Item Already Owned" (Código 7)
    // Se o usuário já possui o item, tentamos consumi-lo para liberar nova compra
    if (!result.success && result.error && (result.error.includes('7') || result.error.includes('already owned'))) {
      console.log('Item já adquirido. Tentando recuperar e consumir...');
      
      try {
        const purchasesResult = await GooglePlayBilling.queryPurchases({ type: 'inapp' });
        const existingPurchase = purchasesResult.purchases?.find((p: any) => p.productId === productId);

        if (existingPurchase && product.type === 'consumable') {
           console.log('Compra encontrada. Consumindo agora...');
           const consumeResult = await GooglePlayBilling.consumePurchase({ purchaseToken: existingPurchase.purchaseToken });
           
           if (consumeResult.success) {
              // Recuperação bem sucedida
              return {
                 success: true,
                 purchaseToken: existingPurchase.purchaseToken,
                 orderId: existingPurchase.orderId,
                 productId: productId
              };
           }
        }
      } catch (recoveryError) {
        console.error('Erro ao tentar recuperar compra:', recoveryError);
      }
    }
    
    return {
      success: false,
      error: result.error || 'Erro ao processar compra'
    };
  } catch (error: any) {
    console.error('Erro ao comprar produto:', error);
    return {
      success: false,
      error: error.message || 'Erro ao processar compra'
    };
  }
}

/**
 * Verifica se uma compra foi concluída e valida
 */
export async function verifyPurchase(purchaseToken: string): Promise<boolean> {
  if (!isBillingAvailable()) {
    return false;
  }

  try {
    const result = await GooglePlayBilling.verifyPurchase({ purchaseToken });
    return result.isValid;
  } catch (error) {
    console.error('Erro ao verificar compra:', error);
    return false;
  }
}

/**
 * Consome um produto comprado (para produtos consumíveis)
 */
export async function consumePurchase(purchaseToken: string): Promise<boolean> {
  if (!isBillingAvailable()) {
    return false;
  }

  try {
    const result = await GooglePlayBilling.consumePurchase({ purchaseToken });
    return result.success;
  } catch (error) {
    console.error('Erro ao consumir compra:', error);
    return false;
  }
}

/**
 * Obtém assinaturas ativas do usuário
 */
export async function getActiveSubscriptions(): Promise<string[]> {
  if (!isBillingAvailable()) {
    return [];
  }

  try {
    const result = await GooglePlayBilling.getActiveSubscriptions();
    return result.subscriptions || [];
  } catch (error) {
    console.error('Erro ao buscar assinaturas:', error);
    return [];
  }
}

/**
 * Abre a página de gerenciamento de assinaturas do Google Play
 */
export function openSubscriptionManagement(): void {
  if (!isBillingAvailable()) {
    return;
  }

  const packageName = 'br.com.fitmeal.app';
  const url = `https://play.google.com/store/account/subscriptions?package=${packageName}`;
  
  // Abrir no navegador ou app do Play Store
  window.open(url, '_blank');
}
