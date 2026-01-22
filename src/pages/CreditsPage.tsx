import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import PageTransition from '../components/PageTransition';
import { 
  Coins, ShoppingCart, CreditCard, CheckCircle, 
  Crown, ArrowRight, Loader2,
  Sparkles, Gift
} from 'lucide-react';
import { useCredits } from '../hooks/useCredits';
import { useAuth } from '../contexts/AuthContext';
import { useProfile } from '../hooks/useProfile';
import { 
  BILLING_PRODUCTS, 
  BillingProduct, 
  purchaseProduct,
  isBillingAvailable,
  openSubscriptionManagement,
  initializeBilling,
  getAvailableProducts
} from '../lib/billingService';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { isUserVip } from '../config/vipConfig';

const CreditsPage: React.FC = () => {
  const { credits, loading: creditsLoading, reload } = useCredits();
  const { profile, loading: profileLoading } = useProfile();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState<BillingProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [purchasingProductId, setPurchasingProductId] = useState<string | null>(null);

  // O VIP é liberado se hasDiscount for true OU se referralCount >= REQUIRED_REFERRALS
  const hasDiscount = isUserVip(profile?.hasDiscount, profile?.referralCount);

  useEffect(() => {
    // Inicializar billing e carregar produtos quando a página carregar
    const initPage = async () => {
      // Sempre começar com produtos locais (fallback)
      setProducts(BILLING_PRODUCTS);
      
      // Pequeno delay para garantir que a página renderizou antes de chamadas nativas
      await new Promise(resolve => setTimeout(resolve, 500));

      // Tentar carregar produtos do Google Play apenas se disponível
      if (isBillingAvailable()) {
        try {
          await initializeBilling();
        } catch (initError) {
          console.warn('Erro ao inicializar billing (não crítico):', initError);
        }
        
        try {
          const availableProducts = await getAvailableProducts();
          if (availableProducts && Array.isArray(availableProducts) && availableProducts.length > 0) {
            setProducts(availableProducts);
          }
        } catch (productsError) {
          console.warn('Erro ao buscar produtos (usando fallback):', productsError);
        }
      }
    };
    
    initPage();
  }, [currentUser]);

  const calculateVipCredits = (originalCredits: number) => {
    return Math.max(originalCredits + 1, Math.round(originalCredits * 1.25));
  };

  const handlePurchase = async (product: BillingProduct) => {
    if (!currentUser) {
      toast.error('Você precisa estar logado para comprar créditos');
      navigate('/login');
      return;
    }

    if (!isBillingAvailable()) {
      toast.error('Compras disponíveis apenas no aplicativo Android');
      return;
    }

    try {
      setPurchasingProductId(product.id);
      setLoading(true);

      const result = await purchaseProduct(product.id);

      if (result.success && result.purchaseToken) {
        // Verificar a compra antes de adicionar créditos
        const { verifyPurchase, consumePurchase } = await import('../lib/billingService');
        const isValid = await verifyPurchase(result.purchaseToken);

        if (isValid) {
          // Adicionar créditos ao usuário (com verificação de duplicação)
          const { addCredits } = await import('../lib/creditsService');
          
          // Aplicar bônus de 25% se o usuário for VIP
          const creditsToAdd = hasDiscount 
            ? calculateVipCredits(product.credits) 
            : product.credits;

          console.log(`Processando compra VIP: ${hasDiscount}, Original: ${product.credits}, Final: ${creditsToAdd}`);

          const wasProcessed = await addCredits(
            currentUser.uid,
            creditsToAdd,
            product.id,
            `Compra: ${product.title}${hasDiscount ? ' (Bônus VIP aplicado)' : ''}`,
            result.purchaseToken,
            result.orderId
          );

          if (wasProcessed) {
            // APÓS adicionar créditos com sucesso, consumir a compra (apenas para produtos consumíveis)
            if (product.type === 'consumable') {
              await consumePurchase(result.purchaseToken);
            }

            // Se usou o bônus VIP, resetar o status VIP para reiniciar o ciclo
            if (hasDiscount && currentUser) {
              await updateDoc(doc(db, 'users', currentUser.uid), {
                hasDiscount: false,
                referralCount: 0,
                lastVipUsedAt: new Date().toISOString()
              });
              console.log('VIP resetado após uso do bônus. Ciclo reiniciado.');
            }

            await reload();
            toast.success(`${creditsToAdd} crédito(s) adicionado(s) com sucesso!${hasDiscount ? ' (Com bônus VIP!)' : ''}`, {
              duration: 5000,
              icon: hasDiscount ? '🎁' : '✅'
            });
          } else {
            toast.error('Esta compra já foi processada anteriormente.');
          }
        } else {
          toast.error('Falha na verificação da compra.');
        }
      } else {
        toast.error(result.error || 'Erro ao processar compra');
      }
    } catch (error: unknown) {
      console.error('Erro ao comprar:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro ao processar compra';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
      setPurchasingProductId(null);
    }
  };

  const rechargeProducts = products.filter(p => p.type === 'consumable');
  const subscriptionProducts = products.filter(p => p.type === 'subscription');

  const getProductIcon = (product: BillingProduct) => {
    if (product.type === 'subscription') {
      return <Crown className="w-6 h-6" />;
    }
    return <Coins className="w-6 h-6" />;
  };

  const getProductBadge = (product: BillingProduct) => {
    if (product.id.includes('premium')) {
      return <span className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full">MAIS POPULAR</span>;
    }
    return null;
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 pb-16">
        {/* Header */}
        <section className="bg-gradient-to-r from-primary-600 to-primary-800 text-white pt-28 pb-12 relative" style={{ width: '100vw', left: '50%', right: '50%', marginLeft: '-50vw', marginRight: '-50vw' }}>
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto text-center">
              <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-6">
                <Coins className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-3xl md:text-4xl font-bold font-display mb-4">
                Compre Créditos e Assinaturas
              </h1>
              <p className="text-primary-50 text-lg mb-8">
                Cada plano personalizado consome 1 crédito. Escolha o melhor plano para você!
              </p>

              {/* Current Credits Display */}
              <div className="flex flex-col md:flex-row gap-4 justify-center items-center">
                {!creditsLoading && credits && (
                  <div className="inline-flex items-center gap-3 bg-white/20 backdrop-blur-sm rounded-full px-8 py-4 border border-white/30">
                    <Sparkles className="w-6 h-6 text-white" />
                    <div className="text-left">
                      <p className="text-primary-100 text-sm">Seus Créditos</p>
                      <p className="text-2xl font-bold text-white">
                        {credits.credits} {credits.credits === 1 ? 'crédito' : 'créditos'}
                      </p>
                    </div>
                  </div>
                )}

                {!profileLoading && hasDiscount && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="inline-flex items-center gap-3 bg-green-500/30 backdrop-blur-sm rounded-full px-8 py-4 border border-green-400/50 shadow-lg"
                  >
                    <Gift className="w-6 h-6 text-white" />
                    <div className="text-left">
                      <p className="text-green-100 text-sm">Status: VIP</p>
                      <p className="text-lg font-bold text-white uppercase tracking-tight">
                        +25% de Bônus Ativado!
                      </p>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Recharge Products */}
        <section className="py-12">
          <div className="container mx-auto px-4">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold font-display mb-2">
                Recargas de Créditos
              </h2>
              <p className="text-neutral-600">
                Compre pacotes de créditos para usar quando precisar
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {rechargeProducts.map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-xl shadow-card hover:shadow-card-hover transition-all border border-neutral-200 overflow-hidden flex flex-col"
                >
                  <div className="p-6 flex-grow">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center text-primary-600">
                        {getProductIcon(product)}
                      </div>
                      {getProductBadge(product)}
                    </div>
                    
                    <h3 className="text-xl font-bold text-neutral-800 mb-2">
                      {product.title}
                    </h3>
                    <p className="text-neutral-600 text-sm mb-4">
                      {product.description}
                    </p>

                    <div className="mb-4">
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-primary-600">
                          {product.price}
                        </span>
                      </div>
                      <div className="text-neutral-500 text-sm mt-1">
                        {hasDiscount ? (
                          <div className="flex flex-col">
                            <span className="text-neutral-400 line-through text-xs">
                              {product.credits} {product.credits === 1 ? 'crédito' : 'créditos'}
                            </span>
                            <span className="flex items-center gap-1 text-green-600 font-bold text-base">
                              <Sparkles className="w-4 h-4" />
                              {calculateVipCredits(product.credits)} créditos (Bônus VIP!)
                            </span>
                          </div>
                        ) : (
                          <span className="text-base">
                            {product.credits} {product.credits === 1 ? 'crédito' : 'créditos'}
                          </span>
                        )}
                      </div>
                    </div>

                    <ul className="space-y-2 mb-6">
                      <li className="flex items-center gap-2 text-sm text-neutral-600">
                        <CheckCircle className="w-4 h-4 text-primary-500 flex-shrink-0" />
                        <span>Válido por tempo indeterminado</span>
                      </li>
                      <li className="flex items-center gap-2 text-sm text-neutral-600">
                        <CheckCircle className="w-4 h-4 text-primary-500 flex-shrink-0" />
                        <span>Use quando quiser</span>
                      </li>
                    </ul>
                  </div>

                  <div className="p-6 pt-0">
                    <button
                      onClick={() => handlePurchase(product)}
                      disabled={loading || purchasingProductId === product.id}
                      className="w-full py-3 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {purchasingProductId === product.id ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Processando...
                        </>
                      ) : (
                        <>
                          <ShoppingCart className="w-5 h-5" />
                          Comprar Agora
                        </>
                      )}
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Subscription Products */}
        <section className="py-12 bg-neutral-50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold font-display mb-2">
                Assinaturas Mensais
              </h2>
              <p className="text-neutral-600">
                Receba créditos automaticamente todo mês
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto items-stretch">
              {subscriptionProducts.map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: (rechargeProducts.length + index) * 0.1 }}
                  className={`bg-white rounded-xl shadow-card hover:shadow-card-hover transition-all border-2 overflow-hidden flex flex-col h-full ${
                    product.id.includes('premium') 
                      ? 'border-primary-500 ring-2 ring-primary-200' 
                      : 'border-neutral-200'
                  }`}
                >
                  <div className="h-10 flex items-center justify-center">
                    {product.id.includes('premium') ? (
                      <div className="bg-gradient-to-r from-primary-500 to-primary-600 text-white text-center py-2 w-full">
                        <span className="text-sm font-bold">MAIS POPULAR</span>
                      </div>
                    ) : null}
                  </div>

                  <div className="p-6 flex-grow flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center text-primary-600">
                        {getProductIcon(product)}
                      </div>
                    </div>
                    
                    <h3 className="text-xl font-bold text-neutral-800 mb-2 min-h-[28px]">
                      {product.title}
                    </h3>
                    <p className="text-neutral-600 text-sm mb-4 min-h-[40px]">
                      {product.description}
                    </p>

                    <div className="mb-4">
                      <div className="flex items-baseline gap-2 flex-wrap">
                        <span className="text-3xl font-bold text-primary-600">
                          {product.price}
                        </span>
                        <span className="text-neutral-500">/mês</span>
                      </div>
                      <div className="text-neutral-500 text-sm mt-1">
                        {hasDiscount ? (
                          <div className="flex flex-col">
                            <span className="text-neutral-400 line-through text-xs">
                              {product.credits} {product.credits === 1 ? 'crédito' : 'créditos'}/mês
                            </span>
                            <span className="flex items-center gap-1 text-green-600 font-bold text-base">
                              <Sparkles className="w-4 h-4" />
                              {calculateVipCredits(product.credits)} créditos/mês (Bônus VIP!)
                            </span>
                          </div>
                        ) : (
                          <span className="text-base">
                            {product.credits} {product.credits === 1 ? 'crédito' : 'créditos'} por mês
                          </span>
                        )}
                      </div>
                    </div>

                    <ul className="space-y-2 mb-6 flex-grow">
                      <li className="flex items-center gap-2 text-sm text-neutral-600">
                        <CheckCircle className="w-4 h-4 text-primary-500 flex-shrink-0" />
                        <span>Renovação automática</span>
                      </li>
                      <li className="flex items-center gap-2 text-sm text-neutral-600">
                        <CheckCircle className="w-4 h-4 text-primary-500 flex-shrink-0" />
                        <span>Cancele a qualquer momento</span>
                      </li>
                      <li className="flex items-center gap-2 text-sm text-neutral-600">
                        <CheckCircle className="w-4 h-4 text-primary-500 flex-shrink-0" />
                        <span>Créditos acumulativos</span>
                      </li>
                    </ul>
                  </div>

                  <div className="p-6 pt-0 mt-auto">
                    <button
                      onClick={() => handlePurchase(product)}
                      disabled={loading || purchasingProductId === product.id}
                      className={`w-full py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
                        product.id.includes('premium')
                          ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white hover:from-primary-600 hover:to-primary-700'
                          : 'bg-primary-500 text-white hover:bg-primary-600'
                      }`}
                    >
                      {purchasingProductId === product.id ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Processando...
                        </>
                      ) : (
                        <>
                          <Crown className="w-5 h-5" />
                          Assinar Agora
                        </>
                      )}
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="mt-8 text-center">
              <button
                onClick={openSubscriptionManagement}
                className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium"
              >
                Gerenciar minhas assinaturas
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </section>

        {/* Info Section */}
        <section className="py-12">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-card p-8">
              <h3 className="text-xl font-bold mb-4 text-center">Como Funciona</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <ShoppingCart className="w-6 h-6 text-primary-600" />
                  </div>
                  <h4 className="font-semibold mb-2">1. Escolha seu Plano</h4>
                  <p className="text-sm text-neutral-600">
                    Selecione entre recargas ou assinaturas mensais
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <CreditCard className="w-6 h-6 text-primary-600" />
                  </div>
                  <h4 className="font-semibold mb-2">2. Faça o Pagamento</h4>
                  <p className="text-sm text-neutral-600">
                    Pagamento seguro via Google Play
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Sparkles className="w-6 h-6 text-primary-600" />
                  </div>
                  <h4 className="font-semibold mb-2">3. Use seus Créditos</h4>
                  <p className="text-sm text-neutral-600">
                    Gere planos personalizados quando quiser
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </PageTransition>
  );
};

export default CreditsPage;
