/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { useAuth } from './hooks/useAuth';
import { Toaster } from './components/ui/sonner';
import { Button } from './components/ui/button';
import { 
  Calculator, 
  LogOut, 
  LayoutDashboard, 
  BookOpen, 
  Users, 
  PlusCircle,
  GraduationCap
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import AuthPage from './components/AuthPage';
import Dashboard from './components/Dashboard';
import Quiz from './components/Quiz';
import MonitorPanel from './components/MonitorPanel';
import { seedInitialData } from './lib/seed';

type View = 'dashboard' | 'quiz' | 'monitor';

export default function App() {
  const { user, profile, loading, signIn, signOut } = useAuth();
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [quizConfig, setQuizConfig] = useState<{ count: number; topic?: string } | null>(null);

  useEffect(() => {
    if (user) {
      seedInitialData();
    }
  }, [user]);

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <Calculator className="h-12 w-12 animate-pulse text-primary" />
          <p className="text-sm font-medium text-slate-500">Carregando Monitoria...</p>
        </div>
      </div>
    );
  }

  if (!user || !profile) {
    return (
      <>
        <AuthPage onSignIn={signIn} />
        <Toaster />
      </>
    );
  }

  const startQuiz = (count: number, topic?: string) => {
    setQuizConfig({ count, topic });
    setCurrentView('quiz');
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <header className="sticky top-0 z-10 border-b bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <div 
            className="flex cursor-pointer items-center gap-2"
            onClick={() => setCurrentView('dashboard')}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white shadow-lg shadow-primary/20">
              <Calculator className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-slate-900 md:text-xl">
                Monitoria <span className="text-primary">Matemática</span>
              </h1>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">3º Ano C</p>
            </div>
          </div>

          <nav className="hidden items-center gap-1 md:flex">
            <Button 
              variant={currentView === 'dashboard' ? 'secondary' : 'ghost'} 
              size="sm"
              onClick={() => setCurrentView('dashboard')}
              className="gap-2"
            >
              <LayoutDashboard className="h-4 w-4" />
              Início
            </Button>
            
            {profile.role === 'monitor' && (
              <Button 
                variant={currentView === 'monitor' ? 'secondary' : 'ghost'} 
                size="sm"
                onClick={() => setCurrentView('monitor')}
                className="gap-2"
              >
                <Users className="h-4 w-4" />
                Painel do Monitor
              </Button>
            )}
          </nav>

          <div className="flex items-center gap-4">
            <div className="hidden text-right md:block">
              <p className="text-sm font-medium leading-none">{profile.name}</p>
              <p className="text-xs text-slate-500">{profile.role === 'monitor' ? 'Monitor' : 'Estudante'}</p>
            </div>
            <Button 
              variant="outline" 
              size="icon" 
              onClick={signOut}
              className="rounded-full"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl p-4 py-8 md:p-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentView}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {currentView === 'dashboard' && (
              <Dashboard onStartQuiz={startQuiz} profile={profile} />
            )}
            {currentView === 'quiz' && quizConfig && (
              <Quiz 
                config={quizConfig} 
                profile={profile} 
                onComplete={() => setCurrentView('dashboard')} 
              />
            )}
            {currentView === 'monitor' && profile.role === 'monitor' && (
              <MonitorPanel />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      <Toaster />
    </div>
  );
}
