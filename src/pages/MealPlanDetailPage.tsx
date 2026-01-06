import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import PageTransition from '../components/PageTransition';
import { 
  ChevronLeft, Clock, Calendar, Target, Dumbbell, 
  Flame, Beef, Wheat, Droplet, CheckCircle, ArrowRight,
  Save, AlertCircle
} from 'lucide-react';
import { useMealPlans } from '../hooks/useMealPlans';
import { toast } from 'react-hot-toast';
import MealCard from '../components/meal-plan/MealCard';
import MacrosSummary from '../components/meal-plan/MacrosSummary';
import PlanFeatures from '../components/meal-plan/PlanFeatures';
import PreparationTips from '../components/meal-plan/PreparationTips';
import FoodSubstitutions from '../components/meal-plan/FoodSubstitutions';
import DownloadPDFButton from '../components/meal-plan/DownloadPDFButton';

interface Food {
  name: string;
  amount: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  preparation?: string;
}

interface MealPlan {
  id: string;
  title: string;
  description: string;
  duration: string;
  meals: number;
  image: string;
  color: string;
  features: string[];
  schedule: {
    time: string;
    name: string;
    description: string;
    macros: {
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
    };
    foods?: Food[];
  }[];
  weeklyPlan?: {
    day: string;
    meals: string[];
  }[];
}

interface GeneratedPlan {
  id?: string;
  title?: string;
  isCustomPlan?: boolean;
  overview: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    meals: number;
    duration: string;
  };
  features: string[];
  meals: {
    time: string;
    name: string;
    description: string;
    foods: {
      name: string;
      amount: string;
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
      preparation: string;
    }[];
    totalCalories: number;
    totalProtein: number;
    totalCarbs: number;
    totalFat: number;
  }[];
  tips: string[];
  substitutions: {
    food: string;
    alternatives: string[];
  }[];
}

const mealPlans: Record<string, MealPlan> = {
  'perda-peso': {
    id: 'perda-peso',
    title: 'Perda de Peso',
    description: 'Plano alimentar com déficit calórico controlado para perda de gordura preservando massa muscular.',
    duration: '8 semanas',
    meals: 5,
    image: 'https://images.pexels.com/photos/1640771/pexels-photo-1640771.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
    color: 'from-blue-500 to-blue-700',
    features: [
      'Déficit calórico moderado de 20%',
      'Maior ênfase em proteínas (2g/kg)',
      'Timing nutricional para treinos',
      'Cardápio rotativo de 21 dias',
      'Opções de substituições'
    ],
    schedule: [
      {
        time: '07:00',
        name: 'Café da Manhã',
        description: 'Omelete de claras com aveia e frutas vermelhas',
        foods: [
          { name: 'Claras de ovo', amount: '6 unidades', calories: 100, protein: 20, carbs: 0, fat: 0 },
          { name: 'Aveia em flocos', amount: '40g', calories: 150, protein: 5, carbs: 25, fat: 3 },
          { name: 'Mix de frutas vermelhas', amount: '100g', calories: 50, protein: 0, carbs: 10, fat: 0 },
          { name: 'Canela em pó', amount: 'a gosto', calories: 0, protein: 0, carbs: 0, fat: 0 }
        ],
        macros: { calories: 350, protein: 25, carbs: 35, fat: 12 }
      },
      {
        time: '10:00',
        name: 'Lanche da Manhã',
        description: 'Iogurte grego proteico com granola fit',
        foods: [
          { name: 'Iogurte grego zero', amount: '170g', calories: 100, protein: 15, carbs: 5, fat: 0 },
          { name: 'Whey protein', amount: '1 scoop', calories: 80, protein: 20, carbs: 2, fat: 1 },
          { name: 'Granola low carb', amount: '20g', calories: 80, protein: 3, carbs: 8, fat: 4 }
        ],
        macros: { calories: 220, protein: 20, carbs: 20, fat: 5 }
      },
      {
        time: '13:00',
        name: 'Almoço',
        description: 'Frango grelhado com mix de vegetais e arroz integral',
        foods: [
          { name: 'Peito de frango', amount: '150g', calories: 165, protein: 35, carbs: 0, fat: 4 },
          { name: 'Arroz integral', amount: '100g', calories: 110, protein: 3, carbs: 25, fat: 1 },
          { name: 'Brócolis', amount: '100g', calories: 55, protein: 3, carbs: 10, fat: 1 },
          { name: 'Cenoura', amount: '100g', calories: 40, protein: 1, carbs: 8, fat: 0 },
          { name: 'Azeite de oliva', amount: '1 colher', calories: 80, protein: 0, carbs: 0, fat: 9 }
        ],
        macros: { calories: 450, protein: 40, carbs: 45, fat: 10 }
      },
      {
        time: '16:00',
        name: 'Lanche da Tarde',
        description: 'Batata doce com atum e mix de folhas',
        foods: [
          { name: 'Batata doce cozida', amount: '150g', calories: 135, protein: 2, carbs: 30, fat: 0 },
          { name: 'Atum em água', amount: '120g', calories: 120, protein: 26, carbs: 0, fat: 1 },
          { name: 'Mix de folhas', amount: '50g', calories: 10, protein: 1, carbs: 2, fat: 0 },
          { name: 'Azeite de oliva', amount: '1/2 colher', calories: 40, protein: 0, carbs: 0, fat: 4.5 }
        ],
        macros: { calories: 280, protein: 25, carbs: 30, fat: 8 }
      },
      {
        time: '19:00',
        name: 'Jantar',
        description: 'Filé de peixe com quinoa e legumes no vapor',
        foods: [
          { name: 'Filé de pescada', amount: '150g', calories: 130, protein: 28, carbs: 0, fat: 2 },
          { name: 'Quinoa cozida', amount: '100g', calories: 120, protein: 4, carbs: 21, fat: 2 },
          { name: 'Mix de legumes', amount: '150g', calories: 75, protein: 3, carbs: 15, fat: 0 },
          { name: 'Azeite de oliva', amount: '1 colher', calories: 80, protein: 0, carbs: 0, fat: 9 }
        ],
        macros: { calories: 380, protein: 35, carbs: 35, fat: 12 }
      }
    ],
    weeklyPlan: [
      { day: 'Segunda', meals: ['Café proteico', 'Salada de atum', 'Frango grelhado'] },
      { day: 'Terça', meals: ['Omelete fit', 'Bowl de quinoa', 'Peixe assado'] },
      { day: 'Quarta', meals: ['Panquecas proteicas', 'Wrap de frango', 'Salmão grelhado'] },
      { day: 'Quinta', meals: ['Overnight oats', 'Bowl de proteína', 'Omelete'] },
      { day: 'Sexta', meals: ['Mingau proteico', 'Salada completa', 'Peixe grelhado'] },
      { day: 'Sábado', meals: ['Tapioca fit', 'Frango assado', 'Atum grelhado'] },
      { day: 'Domingo', meals: ['Crepioca', 'Peixe assado', 'Ovos mexidos'] }
    ]
  },
  'hipertrofia': {
    id: 'hipertrofia',
    title: 'Ganho Muscular',
    description: 'Plano alimentar com superávit calórico para maximizar o ganho de massa muscular.',
    duration: '12 semanas',
    meals: 6,
    image: 'https://images.pexels.com/photos/1320917/pexels-photo-1320917.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
    color: 'from-green-500 to-green-700',
    features: [
      'Superávit calórico de 10-15%',
      'Alta ingestão proteica (2.2g/kg)',
      'Foco em carboidratos nos pré/pós treinos',
      'Estratégias para hardgainers',
      'Nutrição periódica baseada no treino'
    ],
    schedule: [
      {
        time: '06:30',
        name: 'Café da Manhã',
        description: 'Mingau proteico de aveia com frutas e pasta de amendoim',
        foods: [
          { name: 'Aveia em flocos', amount: '80g', calories: 300, protein: 10, carbs: 40, fat: 5 },
          { name: 'Whey protein', amount: '1 scoop', calories: 120, protein: 24, carbs: 3, fat: 1 },
          { name: 'Banana', amount: '1 unidade', calories: 90, protein: 1, carbs: 23, fat: 0 },
          { name: 'Pasta de amendoim', amount: '20g', calories: 120, protein: 5, carbs: 3, fat: 10 }
        ],
        macros: { calories: 450, protein: 35, carbs: 50, fat: 15 }
      },
      {
        time: '09:30',
        name: 'Lanche da Manhã',
        description: 'Sanduíche proteico com frango e abacate',
        foods: [
          { name: 'Pão integral', amount: '2 fatias', calories: 160, protein: 8, carbs: 28, fat: 2 },
          { name: 'Frango desfiado', amount: '100g', calories: 120, protein: 22, carbs: 0, fat: 3 },
          { name: 'Abacate', amount: '50g', calories: 80, protein: 1, carbs: 4, fat: 7 },
          { name: 'Tomate', amount: '2 fatias', calories: 10, protein: 0, carbs: 2, fat: 0 },
          { name: 'Alface', amount: '2 folhas', calories: 5, protein: 0, carbs: 1, fat: 0 }
        ],
        macros: { calories: 380, protein: 25, carbs: 35, fat: 18 }
      },
      {
        time: '12:30',
        name: 'Almoço',
        description: 'Prato brasileiro completo com bife',
        foods: [
          { name: 'Arroz branco', amount: '150g', calories: 195, protein: 4, carbs: 44, fat: 0 },
          { name: 'Feijão carioca', amount: '100g', calories: 120, protein: 7, carbs: 21, fat: 1 },
          { name: 'Bife de patinho', amount: '200g', calories: 260, protein: 46, carbs: 0, fat: 8 },
          { name: 'Mix de legumes', amount: '150g', calories: 75, protein: 3, carbs: 15, fat: 0 },
          { name: 'Azeite de oliva', amount: '2 colheres', calories: 160, protein: 0, carbs: 0, fat: 18 }
        ],
        macros: { calories: 650, protein: 45, carbs: 70, fat: 20 }
      },
      {
        time: '15:30',
        name: 'Pré-treino',
        description: 'Refeição pré-treino rica em carboidratos',
        foods: [
          { name: 'Batata doce assada', amount: '200g', calories: 180, protein: 3, carbs: 40, fat: 0 },
          { name: 'Peito de frango', amount: '120g', calories: 130, protein: 26, carbs: 0, fat: 3 },
          { name: 'Azeite de oliva', amount: '1 colher', calories: 80, protein: 0, carbs: 0, fat: 9 }
        ],
        macros: { calories: 350, protein: 30, carbs: 40, fat: 10 }
      },
      {
        time: '17:30',
        name: 'Pós-treino',
        description: 'Shake pós-treino para recuperação',
        foods: [
          { name: 'Whey protein', amount: '1.5 scoop', calories: 180, protein: 36, carbs: 4, fat: 2 },
          { name: 'Dextrose', amount: '40g', calories: 120, protein: 0, carbs: 40, fat: 0 }
        ],
        macros: { calories: 300, protein: 30, carbs: 45, fat: 2 }
      },
      {
        time: '20:30',
        name: 'Jantar',
        description: 'Salmão grelhado com arroz e vegetais',
        foods: [
          { name: 'Filé de salmão', amount: '180g', calories: 330, protein: 36, carbs: 0, fat: 21 },
          { name: 'Arroz branco', amount: '120g', calories: 156, protein: 3, carbs: 35, fat: 0 },
          { name: 'Legumes grelhados', amount: '200g', calories: 100, protein: 4, carbs: 20, fat: 0 },
          { name: 'Azeite de oliva', amount: '1 colher', calories: 80, protein: 0, carbs: 0, fat: 9 }
        ],
        macros: { calories: 550, protein: 40, carbs: 50, fat: 25 }
      }
    ],
    weeklyPlan: [
      { day: 'Segunda', meals: ['Mingau proteico', 'Frango com arroz', 'Carne vermelha'] },
      { day: 'Terça', meals: ['Omelete reforçado', 'Macarrão integral', 'Salmão'] },
      { day: 'Quarta', meals: ['Panquecas proteicas', 'Arroz com feijão', 'Frango'] },
      { day: 'Quinta', meals: ['Wrap proteico', 'Batata doce', 'Atum'] },
      { day: 'Sexta', meals: ['Overnight oats', 'Carne moída', 'Ovos'] },
      { day: 'Sábado', meals: ['Tapioca proteica', 'Frango assado', 'Peixe'] },
      { day: 'Domingo', meals: ['Crepioca', 'Churrasco', 'Omelete'] }
    ]
  },
  'definicao': {
    id: 'definicao',
    title: 'Definição Muscular',
    description: 'Plano alimentar para redução de gordura corporal mantendo massa muscular e performance.',
    duration: '10 semanas',
    meals: 5,
    image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=1470&auto=format&fit=crop',
    color: 'from-purple-500 to-purple-700',
    features: [
      'Déficit calórico estratégico',
      'Protocolo de carb cycling',
      'Alta ingestão proteica (2.4g/kg)',
      'Estratégias para evitar platôs',
      'Suplementação direcionada'
    ],
    schedule: [
      {
        time: '07:00',
        name: 'Café da Manhã',
        description: 'Omelete proteico com aveia',
        foods: [
          { name: 'Claras de ovo', amount: '8 unidades', calories: 120, protein: 28, carbs: 0, fat: 0 },
          { name: 'Aveia em flocos', amount: '30g', calories: 120, protein: 4, carbs: 20, fat: 2 },
          { name: 'Espinafre', amount: '50g', calories: 15, protein: 2, carbs: 2, fat: 0 },
          { name: 'Azeite de oliva', amount: '1 colher', calories: 80, protein: 0, carbs: 0, fat: 9 }
        ],
        macros: { calories: 300, protein: 30, carbs: 25, fat: 10 }
      },
      {
        time: '10:00',
        name: 'Lanche da Manhã',
        description: 'Shake proteico com frutas',
        foods: [
          { name: 'Whey protein', amount: '1 scoop', calories: 120, protein: 24, carbs: 3, fat: 1 },
          { name: 'Morango', amount: '100g', calories: 35, protein: 1, carbs: 8, fat: 0 },
          { name: 'Framboesa', amount: '50g', calories: 25, protein: 0, carbs: 6, fat: 0 },
          { name: 'Água de coco', amount: '200ml', calories: 20, protein: 0, carbs: 5, fat: 0 }
        ],
        macros: { calories: 200, protein: 25, carbs: 20, fat: 3 }
      },
      {
        time: '13:00',
        name: 'Almoço',
        description: 'Frango grelhado com salada completa',
        foods: [
          { name: 'Peito de frango', amount: '180g', calories: 200, protein: 42, carbs: 0, fat: 4 },
          { name: 'Mix de folhas', amount: '100g', calories: 20, protein: 2, carbs: 4, fat: 0 },
          { name: 'Tomate', amount: '100g', calories: 20, protein: 1, carbs: 4, fat: 0 },
          { name: 'Pepino', amount: '100g', calories: 15, protein: 1, carbs: 3, fat: 0 },
          { name: 'Azeite de oliva', amount: '1.5 colher', calories: 120, protein: 0, carbs: 0, fat: 14 }
        ],
        macros: { calories: 400, protein: 40, carbs: 20, fat: 15 }
      },
      {
        time: '16:00',
        name: 'Pré-treino',
        description: 'Batata doce e whey protein',
        foods: [
          { name: 'Batata doce cozida', amount: '150g', calories: 135, protein: 2, carbs: 30, fat: 0 },
          { name: 'Whey protein', amount: '1 scoop', calories: 120, protein: 24, carbs: 3, fat: 1 },
          { name: 'Canela em pó', amount: 'a gosto', calories: 0, protein: 0, carbs: 0, fat: 0 }
        ],
        macros: { calories: 250, protein: 25, carbs: 35, fat: 2 }
      },
      {
        time: '19:00',
        name: 'Jantar',
        description: 'Peixe grelhado com legumes',
        foods: [
          { name: 'Filé de tilápia', amount: '180g', calories: 180, protein: 36, carbs: 0, fat: 4 },
          { name: 'Brócolis', amount: '150g', calories: 50, protein: 4, carbs: 10, fat: 0 },
          { name: 'Couve-flor', amount: '150g', calories: 35, protein: 3, carbs: 7, fat: 0 },
          { name: 'Azeite de oliva', amount: '1.5 colher', calories: 120, protein: 0, carbs: 0, fat: 14 }
        ],
        macros: { calories: 350, protein: 35, carbs: 15, fat: 18 }
      }
    ],
    weeklyPlan: [
      { day: 'Segunda', meals: ['Omelete fit', 'Frango e salada', 'Peixe'] },
      { day: 'Terça', meals: ['Whey com frutas', 'Atum', 'Ovos'] },
      { day: 'Quarta', meals: ['Panqueca proteica', 'Frango', 'Salmão'] },
      { day: 'Quinta', meals: ['Iogurte grego', 'Carne', 'Omelete'] },
      { day: 'Sexta', meals: ['Shake proteico', 'Peixe', 'Frango'] },
      { day: 'Sábado', meals: ['Omelete', 'Frango', 'Carne'] },
      { day: 'Domingo', meals: ['Whey', 'Peixe', 'Ovos'] }
    ]
  }
};

const MealPlanDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const generatedPlan = location.state?.generatedPlan as GeneratedPlan & { usedFreeCredit?: boolean };
  const plan = id ? mealPlans[id] : null;
  const { savePlan, savedPlans } = useMealPlans();
  const [isSaving, setIsSaving] = useState(false);
  const [hasSaved, setHasSaved] = useState(false);
  const planSavedRef = useRef(false);
  const [isLimitedPlan, setIsLimitedPlan] = useState(false);

  // Verificar se o plano deve estar bloqueado
  // REGRA: Se o plano foi gerado com crédito grátis, SEMPRE bloquear!
  // Não importa se o usuário comprou créditos depois - o plano gerado com crédito grátis fica bloqueado para sempre.
  // Se quiser um plano desbloqueado, precisa usar um crédito PAGO para gerar um NOVO plano.
  useEffect(() => {
    if (!generatedPlan) {
      setIsLimitedPlan(false);
      return;
    }

    // Se o plano foi gerado com crédito grátis = SEMPRE BLOQUEADO
    // Não tem verificação adicional - crédito grátis = plano bloqueado, ponto final.
    if (generatedPlan.usedFreeCredit === true) {
      setIsLimitedPlan(true);
    } else {
      // Plano gerado com crédito pago = liberado
      setIsLimitedPlan(false);
    }
  }, [generatedPlan]);

  const planData = generatedPlan ? {
    title: 'Plano Personalizado',
    description: 'Plano alimentar personalizado baseado no seu perfil e objetivos.',
    duration: generatedPlan.overview.duration,
    meals: generatedPlan.overview.meals,
    image: 'https://images.pexels.com/photos/1640771/pexels-photo-1640771.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
    color: 'from-primary-500 to-primary-700',
    features: generatedPlan.features,
    schedule: generatedPlan.meals.map(meal => ({
      time: meal.time,
      name: meal.name,
      description: meal.description,
      macros: {
        calories: meal.totalCalories,
        protein: meal.totalProtein,
        carbs: meal.totalCarbs,
        fat: meal.totalFat
      },
      foods: meal.foods
    }))
  } : plan;

  // Calcula os totais antes do isAlreadySaved
  const totalCalories = planData!.schedule.reduce((acc, meal) => acc + meal.macros.calories, 0);
  const totalProtein = planData!.schedule.reduce((acc, meal) => acc + meal.macros.protein, 0);
  const totalCarbs = planData!.schedule.reduce((acc, meal) => acc + meal.macros.carbs, 0);
  const totalFat = planData!.schedule.reduce((acc, meal) => acc + meal.macros.fat, 0);

  // Verificar se o plano já está salvo
  useEffect(() => {
    if (planSavedRef.current) {
      setHasSaved(true);
    }
  }, []);

  // Verifica se o plano já está salvo no banco
  const isAlreadySaved = savedPlans.some(savedPlan => {
    if (generatedPlan) {
      // Para planos personalizados, compara os macros e refeições
      return savedPlan.plan.isCustomPlan === true &&
             savedPlan.plan.overview.calories === generatedPlan.overview.calories &&
             savedPlan.plan.overview.protein === generatedPlan.overview.protein &&
             savedPlan.plan.overview.carbs === generatedPlan.overview.carbs &&
             savedPlan.plan.overview.fat === generatedPlan.overview.fat &&
             savedPlan.plan.meals.length === generatedPlan.meals.length;
    } else if (plan) {
      // Para planos prontos, compara o ID
      return savedPlan.plan.id === plan.id || savedPlan.plan.title === plan.title;
    }
    return false;
  });

  const reallyIsAlreadySaved = isAlreadySaved || hasSaved;

  const handleSavePlan = async () => {
    // Bloquear se for plano limitado (crédito grátis)
    if (isLimitedPlan) {
      toast.error('Função bloqueada! Compre créditos para salvar planos.', {
        icon: '🔒',
        duration: 4000
      });
      return;
    }

    if (reallyIsAlreadySaved) {
      toast.error('Este plano já está salvo!');
      return;
    }
    
    if (isSaving) {
      toast('Salvando plano, aguarde...', {
        icon: '⏳'
      });
      return;
    }

    setIsSaving(true);
    planSavedRef.current = true;
    
    try {
      if (!generatedPlan && !plan) {
        toast.error('Nenhum plano disponível para salvar');
        return;
      }

      let planToSave: GeneratedPlan;
      
      if (generatedPlan) {
        // Se for um plano personalizado
        planToSave = {
          ...generatedPlan,
          isCustomPlan: true,
          title: 'Plano Personalizado',
          overview: {
            ...generatedPlan.overview,
            calories: generatedPlan.meals.reduce((acc, meal) => acc + meal.totalCalories, 0),
            protein: generatedPlan.meals.reduce((acc, meal) => acc + meal.totalProtein, 0),
            carbs: generatedPlan.meals.reduce((acc, meal) => acc + meal.totalCarbs, 0),
            fat: generatedPlan.meals.reduce((acc, meal) => acc + meal.totalFat, 0)
          }
        };
      } else {
        // Se for um plano pronto
        planToSave = {
          id: plan!.id,
          isCustomPlan: false,
          title: plan!.title,
          overview: {
            calories: plan!.schedule.reduce((acc, meal) => acc + meal.macros.calories, 0),
            protein: plan!.schedule.reduce((acc, meal) => acc + meal.macros.protein, 0),
            carbs: plan!.schedule.reduce((acc, meal) => acc + meal.macros.carbs, 0),
            fat: plan!.schedule.reduce((acc, meal) => acc + meal.macros.fat, 0),
            meals: plan!.meals,
            duration: plan!.duration
          },
          features: plan!.features,
          meals: plan!.schedule.map(meal => ({
            time: meal.time,
            name: meal.name,
            description: meal.description || '',
            foods: (meal.foods || []).map(food => ({
              ...food,
              preparation: food.preparation || ''
            })),
            totalCalories: meal.macros.calories,
            totalProtein: meal.macros.protein,
            totalCarbs: meal.macros.carbs,
            totalFat: meal.macros.fat
          })),
          tips: [
            'Mantenha os horários das refeições consistentes',
            'Beba bastante água ao longo do dia',
            'Prepare as refeições com antecedência'
          ],
          substitutions: [
            {
              food: 'Arroz branco',
              alternatives: ['Arroz integral', 'Quinoa', 'Batata doce']
            },
            {
              food: 'Frango',
              alternatives: ['Peixe', 'Peru', 'Ovo']
            }
          ]
        };
      }

      if (planToSave) {
        const savedPlan = await savePlan(planToSave);
        if (savedPlan) {
          setHasSaved(true);
          toast.success('Plano salvo com sucesso!');
        } else {
          // Se o hook retornar null, pode ser porque o plano já existe
          setHasSaved(true);
          toast('Este plano já está salvo em sua conta', {
            icon: 'ℹ️'
          });
        }
      }
    } catch (error) {
      planSavedRef.current = false;
      setHasSaved(false);
      toast.error('Erro ao salvar o plano. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!plan && !generatedPlan) {
    return (
      <div className="pt-24 pb-16 container mx-auto px-4 text-center">
        <h1 className="text-2xl font-bold mb-4">Plano não encontrado</h1>
        <p className="mb-6">O plano que você está procurando não existe ou foi removido.</p>
        <Link 
          to="/planos" 
          className="inline-flex items-center text-primary-500 hover:text-primary-600 transition-colors"
        >
          <ChevronLeft size={18} className="mr-1" /> Voltar para planos
        </Link>
      </div>
    );
  }

  // Adicione o botão de salvar no CTA section
  const renderCTA = () => {
    return (
      <>
        {/* Card "Comece Agora" - Mantido para todos os tipos de plano */}
        <div className="bg-primary-500 rounded-xl shadow-sm p-6 text-white mb-6">
          <h2 className="text-lg font-bold mb-2">Comece Agora</h2>
          <p className="text-primary-50 mb-4">
            Personalize este plano de acordo com suas necessidades e comece sua transformação.
          </p>
          <Link
            to="/perfil"
            className="block w-full bg-white text-primary-600 text-center py-2 rounded-lg font-medium hover:bg-primary-50 transition-colors"
          >
            Personalizar Plano
          </Link>
        </div>

        {/* Card "Salvar Plano" */}
        <div className="bg-primary-500 rounded-xl shadow-sm p-6 text-white mb-6 relative overflow-hidden">
          {isLimitedPlan && (
            <div className="absolute inset-0 bg-primary-700/95 backdrop-blur-sm z-10 flex flex-col items-center justify-center p-4 text-center">
              <AlertCircle className="w-10 h-10 mb-3 text-white" />
              <p className="text-sm font-bold mb-2 text-white">Função Bloqueada</p>
              <p className="text-xs text-primary-100 mb-3">Compre créditos para desbloquear</p>
              <Link
                to="/creditos"
                className="bg-white text-primary-600 px-5 py-2 rounded-lg text-sm font-bold hover:bg-primary-50 transition-colors"
              >
                Comprar Créditos
              </Link>
            </div>
          )}
          <h2 className="text-lg font-bold mb-2">Salvar Plano</h2>
          <p className="text-primary-50 mb-4">
            Salve este plano para acessá-lo facilmente depois e acompanhar seu progresso.
          </p>
          <button
            onClick={handleSavePlan}
            disabled={reallyIsAlreadySaved || isSaving || isLimitedPlan}
            className={`w-full ${
              reallyIsAlreadySaved || isSaving || isLimitedPlan
                ? 'bg-primary-400 cursor-not-allowed'
                : 'bg-white hover:bg-primary-50'
            } text-primary-600 text-center py-2 rounded-lg font-medium transition-colors`}
          >
            {reallyIsAlreadySaved ? (
              <span className="flex items-center justify-center gap-2">
                <CheckCircle size={18} />
                Plano Salvo
              </span>
            ) : isSaving ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
                <span>Salvando...</span>
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <Save size={18} />
                Salvar Plano
              </span>
            )}
          </button>
        </div>

        {/* Card "Baixar PDF" */}
        <div className="bg-red-500 rounded-xl shadow-sm p-6 text-white mb-6 relative overflow-hidden">
          {isLimitedPlan && (
            <div className="absolute inset-0 bg-red-700/95 backdrop-blur-sm z-10 flex flex-col items-center justify-center p-4 text-center">
              <AlertCircle className="w-10 h-10 mb-3 text-white" />
              <p className="text-sm font-bold mb-2 text-white">Download Bloqueado</p>
              <p className="text-xs text-red-100 mb-3">Compre créditos para baixar o PDF</p>
              <Link
                to="/creditos"
                className="bg-white text-red-600 px-5 py-2 rounded-lg text-sm font-bold hover:bg-red-50 transition-colors"
              >
                Comprar Créditos
              </Link>
            </div>
          )}
          <h2 className="text-lg font-bold mb-2">Baixar Plano</h2>
          <p className="text-red-50 mb-4">
            Faça o download do seu plano em PDF para consulta offline.
          </p>
          <div className={isLimitedPlan ? 'pointer-events-none opacity-50' : ''}>
            <DownloadPDFButton
              meals={generatedPlan?.meals || plan!.schedule.map(meal => ({
                time: meal.time,
                name: meal.name,
                description: meal.description,
                foods: meal.foods,
                totalCalories: meal.macros.calories,
                totalProtein: meal.macros.protein,
                totalCarbs: meal.macros.carbs,
                totalFat: meal.macros.fat
              }))}
              totalDailyCalories={totalCalories}
              totalDailyProtein={totalProtein}
              totalDailyCarbs={totalCarbs}
              totalDailyFat={totalFat}
            />
          </div>
        </div>
      </>
    );
  };

  return (
    <PageTransition>
    <div className="pt-24 pb-16">
      <div className="container mx-auto px-4">
        {/* Breadcrumb */}
        <div className="mb-6">
          <nav className="flex items-center text-sm text-neutral-500">
            <Link to="/" className="hover:text-primary-500 transition-colors">Início</Link>
            <span className="mx-2">/</span>
            <Link to="/planos" className="hover:text-primary-500 transition-colors">Planos</Link>
            <span className="mx-2">/</span>
            <span className="text-neutral-800 font-medium">{planData!.title}</span>
          </nav>
        </div>

        {/* Hero Section */}
        <div className={`relative rounded-xl overflow-hidden mb-12`}>
          <img 
            src={planData!.image} 
            alt={planData!.title}
            className="w-full h-64 object-cover"
          />
          <div className={`absolute inset-0 bg-gradient-to-r ${planData!.color} opacity-90`}></div>
          <div className="absolute inset-0 flex items-center">
            <div className="container mx-auto px-4">
              <div className="max-w-3xl text-white">
                <h1 className="text-3xl md:text-4xl font-bold mb-4">{planData!.title}</h1>
                <p className="text-lg text-white/90 mb-6">{planData!.description}</p>
                <div className="flex flex-wrap gap-6">
                  <div className="flex items-center gap-2">
                    <Clock size={20} />
                    <span>{planData!.duration}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar size={20} />
                    <span>{planData!.meals} refeições/dia</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-8">
            {/* Features */}
            <div className="mb-8">
              <PlanFeatures features={planData!.features} />
            </div>

            {/* Daily Schedule */}
            <div className="bg-white rounded-xl shadow-sm p-6 mb-8 relative">
              <h2 className="text-xl font-bold mb-8">Cronograma Diário</h2>
              <div className="space-y-8">
                {planData!.schedule.map((meal, index) => {
                  const isBlurred = isLimitedPlan && index >= Math.floor(planData!.schedule.length / 2);
                  return (
                    <div key={index} className={isBlurred ? 'relative' : ''}>
                      {isBlurred && (
                        <div className="absolute inset-0 bg-gradient-to-b from-white/60 to-white/95 backdrop-blur-md z-10 rounded-lg flex items-center justify-center border-2 border-dashed border-primary-200">
                          <div className="text-center p-6 bg-white/90 rounded-2xl shadow-xl border border-primary-100 max-w-sm mx-4">
                            <div className="w-14 h-14 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                              <AlertCircle className="w-7 h-7 text-primary-600" />
                            </div>
                            <h3 className="text-lg font-bold text-neutral-800 mb-2">
                              Conteúdo Bloqueado
                            </h3>
                            <p className="text-neutral-600 mb-4 text-sm">
                              Você está usando créditos gratuitos. Compre créditos para desbloquear o plano completo!
                            </p>
                            <Link
                              to="/creditos"
                              className="inline-block w-full py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors font-bold shadow-lg shadow-primary-200"
                            >
                              Desbloquear Agora
                            </Link>
                          </div>
                        </div>
                      )}
                      <div className={isBlurred ? 'blur-[8px] opacity-30 pointer-events-none select-none' : ''}>
                        <MealCard
                          time={meal.time}
                          name={meal.name}
                          foods={meal.foods || []}
                          totalCalories={meal.macros.calories}
                          totalProtein={meal.macros.protein}
                          totalCarbs={meal.macros.carbs}
                          totalFat={meal.macros.fat}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {generatedPlan && (
              <>
                {/* Dicas de Preparação */}
                <div className={`mb-8 relative ${isLimitedPlan ? 'pointer-events-none' : ''}`}>
                  {isLimitedPlan && (
                    <div className="absolute inset-0 bg-gradient-to-b from-white/60 to-white/95 backdrop-blur-md z-10 rounded-lg flex items-center justify-center border-2 border-dashed border-amber-200">
                      <div className="text-center p-5 bg-white/90 rounded-xl shadow-lg border border-amber-100">
                        <AlertCircle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                        <h3 className="text-sm font-bold text-neutral-800 mb-1">Dicas Bloqueadas</h3>
                        <p className="text-xs text-neutral-600 mb-3">Compre créditos para liberar</p>
                        <Link to="/creditos" className="text-xs font-bold text-primary-600 hover:underline">
                          Ver Créditos →
                        </Link>
                      </div>
                    </div>
                  )}
                  <div className={isLimitedPlan ? 'blur-[6px] opacity-30 select-none' : ''}>
                    <PreparationTips tips={generatedPlan.tips} />
                  </div>
                </div>

                {/* Substituições */}
                <div className={`mb-8 relative ${isLimitedPlan ? 'pointer-events-none' : ''}`}>
                  {isLimitedPlan && (
                    <div className="absolute inset-0 bg-gradient-to-b from-white/60 to-white/95 backdrop-blur-md z-10 rounded-lg flex items-center justify-center border-2 border-dashed border-green-200">
                      <div className="text-center p-5 bg-white/90 rounded-xl shadow-lg border border-green-100">
                        <AlertCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                        <h3 className="text-sm font-bold text-neutral-800 mb-1">Substituições Bloqueadas</h3>
                        <p className="text-xs text-neutral-600 mb-3">Compre créditos para liberar</p>
                        <Link to="/creditos" className="text-xs font-bold text-primary-600 hover:underline">
                          Ver Créditos →
                        </Link>
                      </div>
                    </div>
                  )}
                  <div className={isLimitedPlan ? 'blur-[6px] opacity-30 select-none' : ''}>
                    <FoodSubstitutions substitutions={generatedPlan.substitutions} />
                  </div>
                </div>
              </>
            )}

            {/* Weekly Plan - Only for predefined plans */}
            {plan && plan.weeklyPlan && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-xl font-bold mb-6">Plano Semanal</h2>
                <div className="grid gap-4">
                  {plan.weeklyPlan.map((day, index) => (
                    <div key={index} className="border-b border-neutral-100 last:border-0 pb-4 last:pb-0">
                      <h3 className="font-medium mb-2">{day.day}</h3>
                      <div className="flex flex-wrap gap-2">
                        {day.meals.map((meal, mealIndex) => (
                          <span 
                            key={mealIndex}
                            className="px-3 py-1 bg-neutral-100 rounded-full text-sm text-neutral-700"
                          >
                            {meal}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-4">
            <div className="sticky top-24 space-y-6">
              {/* Macros Summary */}
              <MacrosSummary
                totalCalories={totalCalories}
                totalProtein={totalProtein}
                totalCarbs={totalCarbs}
                totalFat={totalFat}
              />

              {/* CTA */}
              {renderCTA()}

              {/* Support Card */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-lg font-bold mb-4">Precisa de Ajuda?</h2>
                <p className="text-neutral-600 text-sm mb-4">
                  Nossos nutricionistas estão disponíveis para tirar suas dúvidas e ajudar você a alcançar seus objetivos.
                </p>
                <Link
                  to="/contato"
                  className="inline-flex items-center text-primary-500 font-medium hover:text-primary-600 transition-colors"
                >
                  Falar com Especialista
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </PageTransition>
  );
};

export default MealPlanDetailPage;