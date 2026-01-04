import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  getUserCredits,
  consumeCredit,
  hasCredits,
  addCredits,
  UserCredits,
  CreditTransaction
} from '../lib/creditsService';
import { toast } from 'react-hot-toast';

export const useCredits = () => {
  const { currentUser } = useAuth();
  const [credits, setCredits] = useState<UserCredits | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCredits = async () => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const userCredits = await getUserCredits(currentUser.uid);
      setCredits(userCredits);
      setError(null);
    } catch (err: any) {
      console.error('Erro ao carregar créditos:', err);
      setError(err.message || 'Erro ao carregar créditos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCredits();
  }, [currentUser]);

  const consume = async (planId: string, description?: string): Promise<{ success: boolean; usedFreeCredit?: boolean }> => {
    if (!currentUser) {
      toast.error('Você precisa estar logado para gerar planos');
      return { success: false };
    }

    try {
      const result = await consumeCredit(currentUser.uid, planId, description);
      if (result.success) {
        await loadCredits(); // Recarregar créditos
        toast.success('Crédito consumido com sucesso!');
        return result;
      } else {
        toast.error('Você não possui créditos suficientes');
        return { success: false };
      }
    } catch (err: any) {
      console.error('Erro ao consumir crédito:', err);
      toast.error(err.message || 'Erro ao consumir crédito');
      return { success: false };
    }
  };

  const checkHasCredits = async (required: number = 1): Promise<boolean> => {
    if (!currentUser) return false;

    try {
      return await hasCredits(currentUser.uid, required);
    } catch (err) {
      console.error('Erro ao verificar créditos:', err);
      return false;
    }
  };

  const add = async (amount: number, productId: string, description: string) => {
    if (!currentUser) {
      throw new Error('Usuário não autenticado');
    }

    try {
      await addCredits(currentUser.uid, amount, productId, description);
      await loadCredits(); // Recarregar créditos
      toast.success(`${amount} crédito(s) adicionado(s) com sucesso!`);
    } catch (err: any) {
      console.error('Erro ao adicionar créditos:', err);
      toast.error(err.message || 'Erro ao adicionar créditos');
      throw err;
    }
  };

  return {
    credits,
    loading,
    error,
    consume,
    checkHasCredits,
    add,
    reload: loadCredits
  };
};

