import React, { useState } from 'react';
import { Calculator, LayoutDashboard, Users, LogOut, BookOpen, GraduationCap, Trophy, Play, CheckCircle2, AlertCircle } from 'lucide-react';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentView, setCurrentView] = useState('dashboard');
  const [email, setEmail] = useState('');

  // Função simples de Login (Simulada para não dar erro de banco de dados)
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.length > 3) setIsLoggedIn(true);
  };

  // TELA DE LOGIN (Igual ao que o AI Studio sugere)
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-slate-100">
          <div className="flex justify-center mb-6">
            <div className="h-16 w-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
              <Calculator size={32} />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-center text-slate-900 mb-2">Monitoria Matemática</h2>
          <p className="text-center text-slate-500 mb-8">3º ANO C - Acesse sua conta</p>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700">E-mail ou Usuário</label>
              <input 
                type="text" 
                className="w-full mt-1 px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all" 
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Senha</label>
              <input type="password" title="senha" className="w-full mt-1 px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="••••••••" required />
            </div>
            <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200">
              Entrar no Painel
            </button>
          </form>
        </div>
      </div>
    );
  }

  // TELA PRINCIPAL (Visual IDÊNTICO à sua Imagem 2)
  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-900">
      {/* NAVBAR */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-[#1E1E1E] p-2 rounded-lg text-white">
              <Calculator size={20} />
            </div>
            <div>
              <h1 className="font-bold text-slate-900 leading-none">Monitoria Matemática</h1>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">3º ANO C</span>
            </div>
          </div>

          <div className="hidden md:flex bg-slate-100 p-1 rounded-xl">
            <button onClick={() => setCurrentView('dashboard')} className={`px-4 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2 ${currentView === 'dashboard' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}>
              <LayoutDashboard size={16} /> Início
            </button>
            <button onClick={() => setCurrentView('monitor')} className={`px-4 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2 ${currentView === 'monitor' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}>
              <Users size={16} /> Painel do Monitor
            </button>
          </div>

          <div className="flex items-center gap-3 border-l pl-3">
            <div className="text-right">
              <p className="text-xs font-bold text-slate-900">Halysson Brenno</p>
              <p className="text-[10px] text-slate-400 font-medium uppercase">Monitor</p>
            </div>
            <button onClick={() => setIsLoggedIn(false)} className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-full transition-colors">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 md:p-8 space-y-8">
        {currentView === 'dashboard' ? (
          <>
            {/* BANNER PRINCIPAL (IGUAL IMAGEM 2) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-gradient-to-br from-[#3B429F] to-[#6A72D1] rounded-[2rem] p-8 text-white relative overflow-hidden shadow-2xl shadow-indigo-100">
                <div className="relative z-10">
                  <h2 className="text-3xl md:text-4xl font-bold mb-2">Olá, Halysson Brenno! 👋</h2>
                  <p className="opacity-80 mb-8 font-medium">Pronto para a monitoria de hoje?</p>
                  
                  <div className="flex gap-8 mb-8">
                    <div>
                      <p className="text-[10px] uppercase font-bold opacity-60 tracking-wider">Simulados Feitos</p>
                      <p className="text-2xl font-bold">1</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold opacity-60 tracking-wider">Precisão Geral</p>
                      <p className="text-2xl font-bold flex items-center gap-1">0% <span className="text-green-400 text-xs">↗</span></p>
                    </div>
                  </div>

                  <button className="bg-white text-slate-900 px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:scale-105 transition-transform shadow-lg">
                    <Play size={18} fill="currentColor" /> Começar Novo Simulado
                  </button>
                </div>
                <div className="absolute right-[-20px] bottom-[-20px] opacity-10">
                   <Calculator size={200} />
                </div>
              </div>

              {/* ÚLTIMO DESEMPENHO */}
              <div className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2"><Trophy size={18} className="text-yellow-500" /> Último Desempenho</h3>
                    <span className="text-[10px] bg-slate-100 px-2 py-1 rounded text-slate-500 font-bold uppercase">Preview</span>
                  </div>
                  <div className="flex items-center justify-between bg-slate-50 p-6 rounded-2xl border border-dashed border-slate-200">
                    <div>
                      <p className="text-xs text-slate-400 font-bold uppercase tracking-tight">Acertos</p>
                      <p className="text-3xl font-black text-slate-700">0/1</p>
                    </div>
                    <div className="h-16 w-16 rounded-full border-4 border-slate-200 border-t-blue-500 flex items-center justify-center font-bold text-slate-400 text-sm">
                      0%
                    </div>
                  </div>
                </div>
                <p className="text-[10px] text-slate-400 font-medium text-center mt-4">Realizado em 25 de abril</p>
              </div>
            </div>

            {/* GRID DE BAIXO */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm">
                <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-6"><Calculator size={20} className="text-blue-500" /> Configurar Simulado</h3>
                <div className="space-y-6">
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase mb-3">Quantidade de Questões</p>
                    <div className="flex gap-2">
                      {[5, 10, 15, 20].map(n => (
                        <button key={n} className={`flex-1 py-2 rounded-lg font-bold border transition-all ${n === 10 ? 'bg-[#1E1E1E] text-white border-[#1E1E1E]' : 'bg-white text-slate-400 hover:border-slate-300'}`}>{n}</button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase mb-3">Assunto (Opcional)</p>
                    <div className="flex flex-wrap gap-2">
                      {['Todos', 'Probabilidade', 'Logaritmos', 'Estatística', 'Geometria'].map(t => (
                        <button key={t} className={`px-4 py-1.5 rounded-full text-xs font-bold border ${t === 'Todos' ? 'bg-[#1E1E1E] text-white' : 'bg-white text-slate-400'}`}>{t}</button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm">
                <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-6"><AlertCircle size={20} className="text-orange-500" /> Pontos de Atenção</h3>
                <div className="bg-orange-50/50 p-4 rounded-2xl border border-orange-100 flex items-center justify-between">
                   <div className="flex items-center gap-3">
                      <div className="bg-orange-100 text-orange-600 p-2 rounded-xl text-[10px] font-black uppercase">Probabilidade</div>
                   </div>
                   <span className="text-xs font-bold text-orange-600">100% de Erro</span>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="bg-white rounded-[2rem] p-12 text-center border border-slate-100 shadow-sm">
            <Users size={64} className="mx-auto text-blue-600 mb-4 opacity-20" />
            <h2 className="text-2xl font-bold text-slate-800">Painel do Monitor</h2>
            <p className="text-slate-500 max-w-xs mx-auto">Em breve você poderá gerenciar alunos e dúvidas aqui.</p>
          </div>
        )}
      </main>
    </div>
  );
}