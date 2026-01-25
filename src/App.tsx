import React, { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { TourProvider } from './contexts/TourContext';
import { useScrollToTop } from './hooks/useScrollToTop';
import PrivateRoute from './components/auth/PrivateRoute';
import AdminRoute from './components/auth/AdminRoute';
import { Toaster } from 'react-hot-toast';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Capacitor } from '@capacitor/core';

// Layouts
import MainLayout from './layouts/MainLayout';

// Pages
import HomePage from './pages/HomePage';
import RecipesPage from './pages/RecipesPage';
import MealPlansPage from './pages/MealPlansPage';
import TrackerPage from './pages/TrackerPage';
import ProfilePage from './pages/ProfilePage';
import MealPlanDetailPage from './pages/MealPlanDetailPage';
import RecipeDetailPage from './pages/RecipeDetailPage';
import NotFoundPage from './pages/NotFoundPage';
import ShoppingListPage from './pages/ShoppingListPage';
import LoginPage from './pages/LoginPage';
import SignUpPage from './pages/SignUpPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import SuggestedRecipesPage from './pages/SuggestedRecipesPage';
import FoodRecognitionPage from './pages/FoodRecognitionPage';
import AdminPage from './pages/AdminPage';
import NewsPage from './pages/NewsPage';
import NewsDetailPage from './pages/NewsDetailPage';
import AdminNewsPage from './pages/AdminNewsPage';
import TermsOfUsePage from './pages/TermsOfUsePage';
import AdminTermsPage from './pages/AdminTermsPage';
import CreditsPage from './pages/CreditsPage';
import MyCreditsPage from './pages/MyCreditsPage';

function AppContent() {
  useScrollToTop();

  useEffect(() => {
    const configureStatusBar = async () => {
      if (!Capacitor.isNativePlatform()) return;

      try {
        // Não deixar a WebView ficar por trás da status bar
        await StatusBar.setOverlaysWebView({ overlay: false });

        if (Capacitor.getPlatform() === 'android') {
          await StatusBar.setBackgroundColor({ color: '#FFFFFF' });
          await StatusBar.setStyle({ style: Style.Dark });
        }
      } catch (e) {
        console.log('StatusBar:', e);
      }
    };

    configureStatusBar();
  }, []);

  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<HomePage />} />
        <Route path="receitas" element={<RecipesPage />} />
        <Route path="receitas/:id" element={<RecipeDetailPage />} />
        <Route path="planos" element={<PrivateRoute><MealPlansPage /></PrivateRoute>} />
        <Route path="planos/:id" element={<PrivateRoute><MealPlanDetailPage /></PrivateRoute>} />
        <Route path="planos/personalizado" element={<PrivateRoute><MealPlanDetailPage /></PrivateRoute>} />
        <Route path="sugestoes-receitas" element={<PrivateRoute><SuggestedRecipesPage /></PrivateRoute>} />
        <Route path="reconhecimento-alimentos" element={<PrivateRoute><FoodRecognitionPage /></PrivateRoute>} />
        <Route path="tracker" element={<PrivateRoute><TrackerPage /></PrivateRoute>} />
        <Route path="lista-compras" element={<PrivateRoute><ShoppingListPage /></PrivateRoute>} />
        <Route path="perfil" element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
        <Route path="creditos" element={<PrivateRoute><CreditsPage /></PrivateRoute>} />
        <Route path="meus-creditos" element={<PrivateRoute><MyCreditsPage /></PrivateRoute>} />
        <Route path="admin" element={<AdminRoute><AdminPage /></AdminRoute>} />
        <Route path="admin/termos" element={<AdminRoute><AdminTermsPage /></AdminRoute>} />
        <Route path="news" element={<NewsPage />} />
        <Route path="news/:id" element={<NewsDetailPage />} />
        <Route path="admin/news" element={<AdminRoute><AdminNewsPage /></AdminRoute>} />
        <Route path="termos-de-uso" element={<TermsOfUsePage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>

      <Route path="/login" element={<LoginPage />} />
      <Route path="/cadastro" element={<SignUpPage />} />
      <Route path="/recuperar-senha" element={<ResetPasswordPage />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <TourProvider>
        <AppContent />
        <Toaster
          position="top-center"
          containerStyle={{ top: 100 }}
          toastOptions={{
            style: {
              maxWidth: '90vw',
            },
          }}
        />
      </TourProvider>
    </AuthProvider>
  );
}

export default App;