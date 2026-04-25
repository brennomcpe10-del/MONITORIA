import React, { useState } from 'react';
import { Calculator, LayoutDashboard, Users, LogOut, BookOpen, GraduationCap, Trophy } from 'lucide-react';

// Versão "Blindada" para funcionar na Vercel sem erros de arquivos faltando
export default function App() {
  const [currentView, setCurrentView] = useState('dashboard');

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* HEADER */}
      <header className="sticky top-0 z-10 border-b bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <div className="flex items-center gap-2" onClick={() => setCurrentView('dashboard')} style={{cursor: 'pointer'}}>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg">
              <Calculator className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-slate-900">
                Monitoria <span className="text-blue-600">Matemática</span>
              </h1>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">3º Ano C</p>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-4">
            <button 
              onClick={() => setCurrentView('dashboard')}
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium ${currentView === 'dashboard' ? 'bg-blue-100 text-blue-700' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              <LayoutDashboard className="h-4 w-4" /> Início
            </button>
            <button 
              onClick={() => setCurrentView('monitor')}
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium ${currentView === 'monitor' ? 'bg-blue-100 text-blue-700' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              <Users className="h-4 w-4" /> Painel do Monitor
            </button>
          </nav>

          <div className="flex items-center gap-3 border-l pl-3">
             <div className="text-right hidden sm:block">
                <p className="text-sm font-bold">Usuário Teste</p>
                <p className="text-xs text-slate-500">Estudante</p>
             </div>
             <button className="p-2 hover:bg-slate-100 rounded-full text-slate-500">
                <LogOut className="h-5 w-5" />
             </button>
          </div>
        </div>
      </header>

      {/* CONTEÚDO */}
      <main className="mx-auto max-w-7xl p-6">
        {currentView === 'dashboard' ? (
          <div className="space-y-6">
            <div className="bg-blue-600 rounded-2xl p-8 text-white shadow-xl">
              <h2 className="text-3xl font-bold mb-2">Bem-vindo à Monitoria! 🚀</h2>
              <p className="opacity-90">Prepare-se para o ENEM e provas com nossos quizzes e materiais.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-xl border shadow-sm hover:shadow-md transition-shadow">
                <div className="h-12 w-12 bg-orange-100 text-orange-600 rounded-lg flex items-center justify-center mb-4">
                  <BookOpen className="h-6 w-6" />
                </div>
                <h3 className="font-bold text-lg">Praticar Exercícios</h3>
                <p className="text-slate-500 text-sm mb-4">Resolva questões de Geometria e Álgebra.</p>
                <button className="w-full bg-slate-900 text-white py-2 rounded-lg hover:bg-slate-800">Começar Quiz</button>
              </div>

              <div className="bg-white p-6 rounded-xl border shadow-sm">
                <div className="h-12 w-12 bg-green-100 text-green-600 rounded-lg flex items-center justify-center mb-4">
                  <GraduationCap className="h-6 w-6" />
                </div>
                <h3 className="font-bold text-lg">Material de Apoio</h3>
                <p className="text-slate-500 text-sm mb-4">Acesse PDFs e resumos das aulas.</p>
                <button className="w-full border border-slate-200 py-2 rounded-lg hover:bg-slate-50">Ver Materiais</button>
              </div>

              <div className="bg-white p-6 rounded-xl border shadow-sm">
                <div className="h-12 w-12 bg-yellow-100 text-yellow-600 rounded-lg flex items-center justify-center mb-4">
                  <Trophy className="h-6 w-6" />
                </div>
                <h3 className="font-bold text-lg">Ranking da Turma</h3>
                <p className="text-slate-500 text-sm mb-4">Veja quem são os destaques do mês.</p>
                <button className="w-full border border-slate-200 py-2 rounded-lg hover:bg-slate-50">Ver Ranking</button>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white p-10 rounded-2xl border text-center space-y-4">
            <Users className="h-16 w-16 text-blue-600 mx-auto" />
            <h2 className="text-2xl font-bold">Painel do Monitor</h2>
            <p className="text-slate-500">Aqui você poderá gerenciar as dúvidas dos alunos em breve.</p>
            <button onClick={() => setCurrentView('dashboard')} className="text-blue-600 font-medium">Voltar para o Início</button>
          </div>
        )}
      </main>
    </div>
  );
}