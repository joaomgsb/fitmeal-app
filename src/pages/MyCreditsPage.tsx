import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PageTransition from '../components/PageTransition';
import { 
  Wallet, TrendingUp, TrendingDown, Clock, Calendar,
  Receipt, X, Copy, Check, Sparkles, ArrowUpRight, 
  ArrowDownRight, Crown, ShoppingCart, Gift, RefreshCw,
  ChevronRight, Filter
} from 'lucide-react';
import { useCredits } from '../hooks/useCredits';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { CreditTransaction } from '../lib/creditsService';
import { toast } from 'react-hot-toast';

// Componente do Modal de Comprovante (estilo PIX)
interface ReceiptModalProps {
  transaction: CreditTransaction;
  onClose: () => void;
  userEmail: string;
}

const ReceiptModal: React.FC<ReceiptModalProps> = ({ transaction, onClose, userEmail }) => {
  const [copied, setCopied] = useState(false);
  const isCredit = transaction.amount > 0;

  const handleCopyId = () => {
    navigator.clipboard.writeText(transaction.id);
    setCopied(true);
    toast.success('ID copiado!');
    setTimeout(() => setCopied(false), 2000);
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTransactionTypeLabel = (type: CreditTransaction['type']) => {
    const labels: Record<CreditTransaction['type'], string> = {
      purchase: 'Compra de Créditos',
      consumption: 'Uso de Crédito',
      subscription: 'Assinatura',
      refund: 'Reembolso'
    };
    return labels[type];
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header do Comprovante */}
          <div className={`p-6 ${isCredit ? 'bg-gradient-to-br from-emerald-500 to-teal-600' : 'bg-gradient-to-br from-rose-500 to-pink-600'} text-white relative`}>
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                {isCredit ? (
                  <ArrowUpRight className="w-6 h-6" />
                ) : (
                  <ArrowDownRight className="w-6 h-6" />
                )}
              </div>
              <div>
                <p className="text-white/80 text-sm">{getTransactionTypeLabel(transaction.type)}</p>
                <p className="text-lg font-semibold">{isCredit ? 'Entrada' : 'Saída'}</p>
              </div>
            </div>
            
            <div className="text-center py-4">
              <p className="text-white/80 text-sm mb-1">Valor da Transação</p>
              <p className="text-4xl font-bold">
                {isCredit ? '+' : ''}{Math.abs(transaction.amount)} {Math.abs(transaction.amount) === 1 ? 'crédito' : 'créditos'}
              </p>
            </div>
          </div>
          
          {/* Detalhes do Comprovante */}
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-neutral-100">
              <span className="text-neutral-500 text-sm">Data e Hora</span>
              <span className="font-medium text-neutral-800 text-sm text-right">
                {formatDate(transaction.timestamp)}
              </span>
            </div>
            
            <div className="flex items-center justify-between py-3 border-b border-neutral-100">
              <span className="text-neutral-500 text-sm">Descrição</span>
              <span className="font-medium text-neutral-800 text-sm text-right max-w-[200px]">
                {transaction.description}
              </span>
            </div>
            
            {transaction.productId && (
              <div className="flex items-center justify-between py-3 border-b border-neutral-100">
                <span className="text-neutral-500 text-sm">Produto</span>
                <span className="font-medium text-neutral-800 text-sm">
                  {transaction.productId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </span>
              </div>
            )}
            
            {transaction.orderId && (
              <div className="flex items-center justify-between py-3 border-b border-neutral-100">
                <span className="text-neutral-500 text-sm">ID do Pedido</span>
                <span className="font-medium text-neutral-800 text-xs font-mono">
                  {transaction.orderId.substring(0, 16)}...
                </span>
              </div>
            )}
            
            <div className="flex items-center justify-between py-3 border-b border-neutral-100">
              <span className="text-neutral-500 text-sm">Usuário</span>
              <span className="font-medium text-neutral-800 text-sm">
                {userEmail}
              </span>
            </div>
            
            <div className="flex items-center justify-between py-3">
              <span className="text-neutral-500 text-sm">ID da Transação</span>
              <button
                onClick={handleCopyId}
                className="flex items-center gap-2 font-mono text-xs bg-neutral-100 px-3 py-1.5 rounded-lg hover:bg-neutral-200 transition-colors"
              >
                {transaction.id.substring(0, 12)}...
                {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4 text-neutral-400" />}
              </button>
            </div>
          </div>
          
          {/* Rodapé */}
          <div className="px-6 pb-6">
            <div className="bg-neutral-50 rounded-xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Receipt className="w-5 h-5 text-primary-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-neutral-800">Comprovante FitMeal</p>
                <p className="text-xs text-neutral-500">Este documento serve como comprovante oficial da sua transação.</p>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// Componente do Card de Transação
interface TransactionCardProps {
  transaction: CreditTransaction;
  onClick: () => void;
}

const TransactionCard: React.FC<TransactionCardProps> = ({ transaction, onClick }) => {
  const isCredit = transaction.amount > 0;

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return `Hoje, ${date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (date.toDateString() === yesterday.toDateString()) {
      return `Ontem, ${date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
    }
    
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getIcon = () => {
    switch (transaction.type) {
      case 'purchase':
        return <ShoppingCart className="w-5 h-5" />;
      case 'subscription':
        return <Crown className="w-5 h-5" />;
      case 'consumption':
        return <Sparkles className="w-5 h-5" />;
      case 'refund':
        return <RefreshCw className="w-5 h-5" />;
      default:
        return <Wallet className="w-5 h-5" />;
    }
  };

  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      className="w-full bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-all border border-neutral-100 flex items-center gap-4 text-left"
    >
      {/* Ícone */}
      <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
        isCredit 
          ? 'bg-emerald-100 text-emerald-600' 
          : 'bg-rose-100 text-rose-600'
      }`}>
        {getIcon()}
      </div>
      
      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-neutral-800 truncate">
          {transaction.description}
        </p>
        <div className="flex items-center gap-2 mt-1">
          <Clock className="w-3.5 h-3.5 text-neutral-400" />
          <span className="text-sm text-neutral-500">{formatDate(transaction.timestamp)}</span>
        </div>
      </div>
      
      {/* Valor */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <span className={`text-lg font-bold ${isCredit ? 'text-emerald-600' : 'text-rose-600'}`}>
          {isCredit ? '+' : ''}{transaction.amount}
        </span>
        <ChevronRight className="w-5 h-5 text-neutral-300" />
      </div>
    </motion.button>
  );
};

type FilterType = 'all' | 'credit' | 'debit';

const MyCreditsPage: React.FC = () => {
  const { credits, loading } = useCredits();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [selectedTransaction, setSelectedTransaction] = useState<CreditTransaction | null>(null);
  const [filter, setFilter] = useState<FilterType>('all');

  // Filtrar e ordenar transações
  const filteredTransactions = useMemo(() => {
    if (!credits?.transactions) return [];
    
    let filtered = [...credits.transactions];
    
    // Aplicar filtro
    if (filter === 'credit') {
      filtered = filtered.filter(t => t.amount > 0);
    } else if (filter === 'debit') {
      filtered = filtered.filter(t => t.amount < 0);
    }
    
    // Ordenar por data (mais recente primeiro)
    return filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [credits?.transactions, filter]);

  // Calcular totais
  const totals = useMemo(() => {
    if (!credits?.transactions) return { entries: 0, exits: 0 };
    
    return credits.transactions.reduce((acc, t) => {
      if (t.amount > 0) {
        acc.entries += t.amount;
      } else {
        acc.exits += Math.abs(t.amount);
      }
      return acc;
    }, { entries: 0, exits: 0 });
  }, [credits?.transactions]);

  // Agrupar transações por data
  const groupedTransactions = useMemo(() => {
    const groups: Record<string, CreditTransaction[]> = {};
    
    filteredTransactions.forEach(transaction => {
      const date = new Date(transaction.timestamp);
      const key = date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
      
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(transaction);
    });
    
    return groups;
  }, [filteredTransactions]);

  if (loading) {
    return (
      <PageTransition>
        <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 flex items-center justify-center">
          <div className="animate-pulse flex flex-col items-center gap-4">
            <div className="w-16 h-16 bg-primary-200 rounded-full" />
            <div className="h-4 w-32 bg-primary-200 rounded" />
          </div>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 pb-16">
        {/* Header */}
        <section className="bg-gradient-to-r from-indigo-600 to-purple-700 text-white pt-28 pb-8 relative overflow-visible" style={{ width: '100vw', left: '50%', right: '50%', marginLeft: '-50vw', marginRight: '-50vw' }}>
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto text-center">
              <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-6">
                <Wallet className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-3xl md:text-4xl font-bold font-display mb-4">
                Meus Créditos
              </h1>
              <p className="text-indigo-100 text-lg mb-8">
                Acompanhe seu extrato e histórico de transações
              </p>

              {/* Current Credits Display */}
              <div className="inline-flex items-center gap-3 bg-white/20 backdrop-blur-sm rounded-full px-8 py-4 border border-white/30">
                <Sparkles className="w-6 h-6 text-white" />
                <div className="text-left">
                  <p className="text-indigo-100 text-sm">Saldo Atual</p>
                  <p className="text-2xl font-bold text-white">
                    {credits?.credits ?? 0} {(credits?.credits ?? 0) === 1 ? 'crédito' : 'créditos'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Cards */}
        <section className="py-8">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {/* Card de Entradas */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-white rounded-xl shadow-lg p-5 border border-neutral-100"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-emerald-600" />
                    </div>
                    <span className="text-sm text-neutral-500">Entradas</span>
                  </div>
                  <p className="text-2xl font-bold text-emerald-600">+{totals.entries}</p>
                  <p className="text-xs text-neutral-400 mt-1">créditos adquiridos</p>
                </motion.div>

                {/* Card de Saídas */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-white rounded-xl shadow-lg p-5 border border-neutral-100"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-rose-100 rounded-lg flex items-center justify-center">
                      <TrendingDown className="w-5 h-5 text-rose-600" />
                    </div>
                    <span className="text-sm text-neutral-500">Saídas</span>
                  </div>
                  <p className="text-2xl font-bold text-rose-600">-{totals.exits}</p>
                  <p className="text-xs text-neutral-400 mt-1">créditos utilizados</p>
                </motion.div>

                {/* Card de Comprar mais */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl shadow-lg p-5 col-span-2 md:col-span-1 cursor-pointer hover:shadow-xl transition-shadow"
                  onClick={() => navigate('/creditos')}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                      <Gift className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-sm text-primary-100">Comprar Mais</span>
                  </div>
                  <p className="text-lg font-bold text-white">Adquirir Créditos</p>
                  <p className="text-xs text-primary-100 mt-1">Clique para ver planos</p>
                </motion.div>
              </div>
            </div>
          </div>
        </section>

        {/* Filter Tabs */}
        <section className="py-4">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center gap-2 bg-white rounded-xl p-1.5 shadow-sm border border-neutral-100">
                <button
                  onClick={() => setFilter('all')}
                  className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                    filter === 'all' 
                      ? 'bg-primary-500 text-white shadow-md' 
                      : 'text-neutral-600 hover:bg-neutral-50'
                  }`}
                >
                  <Filter className="w-4 h-4" />
                  Todas
                </button>
                <button
                  onClick={() => setFilter('credit')}
                  className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                    filter === 'credit' 
                      ? 'bg-emerald-500 text-white shadow-md' 
                      : 'text-neutral-600 hover:bg-neutral-50'
                  }`}
                >
                  <TrendingUp className="w-4 h-4" />
                  Entradas
                </button>
                <button
                  onClick={() => setFilter('debit')}
                  className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                    filter === 'debit' 
                      ? 'bg-rose-500 text-white shadow-md' 
                      : 'text-neutral-600 hover:bg-neutral-50'
                  }`}
                >
                  <TrendingDown className="w-4 h-4" />
                  Saídas
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Transactions List */}
        <section className="py-6">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-neutral-800 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary-500" />
                  Histórico de Transações
                </h2>
                <span className="text-sm text-neutral-500">
                  {filteredTransactions.length} {filteredTransactions.length === 1 ? 'transação' : 'transações'}
                </span>
              </div>

              {filteredTransactions.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-white rounded-xl p-12 text-center shadow-sm border border-neutral-100"
                >
                  <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Receipt className="w-8 h-8 text-neutral-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-neutral-700 mb-2">
                    Nenhuma transação encontrada
                  </h3>
                  <p className="text-neutral-500 mb-6">
                    {filter === 'all' 
                      ? 'Você ainda não possui transações de créditos.'
                      : filter === 'credit'
                        ? 'Você ainda não possui entradas de créditos.'
                        : 'Você ainda não utilizou créditos.'}
                  </p>
                  <button
                    onClick={() => navigate('/creditos')}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 transition-colors"
                  >
                    <ShoppingCart className="w-5 h-5" />
                    Comprar Créditos
                  </button>
                </motion.div>
              ) : (
                <div className="space-y-6">
                  {Object.entries(groupedTransactions).map(([date, transactions], groupIndex) => (
                    <motion.div
                      key={date}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: groupIndex * 0.1 }}
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className="h-px flex-1 bg-neutral-200" />
                        <span className="text-sm font-medium text-neutral-500 px-2">{date}</span>
                        <div className="h-px flex-1 bg-neutral-200" />
                      </div>
                      
                      <div className="space-y-3">
                        {transactions.map((transaction, index) => (
                          <motion.div
                            key={transaction.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                          >
                            <TransactionCard
                              transaction={transaction}
                              onClick={() => setSelectedTransaction(transaction)}
                            />
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Modal de Comprovante */}
        {selectedTransaction && (
          <ReceiptModal
            transaction={selectedTransaction}
            onClose={() => setSelectedTransaction(null)}
            userEmail={currentUser?.email || 'Usuário'}
          />
        )}
      </div>
    </PageTransition>
  );
};

export default MyCreditsPage;

