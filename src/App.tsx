import React, { useState } from 'react';
import { Calculator, LayoutDashboard, Users, LogOut, Play, Trophy, AlertCircle, CheckCircle2, ChevronRight } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<{name: string, role: 'student' | 'monitor'} | null>(null);
  const [currentView, setCurrentView] = useState('dashboard');
  const [email, setEmail] = useState('');
  
  // Estados do Simulado
  const [selectedQty, setSelectedQty] = useState(10);
  const [selectedTopic, setSelectedTopic] = useState('Todos');
  const [isSimulating, setIsSimulating] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.toLowerCase().includes('monitor')) {
      setUser({ name: 'Halysson Brenno', role: 'monitor' });
    } else {
      setUser({ name: 'Estudante Novo', role: 'student' });
    }
    setIsLoggedIn(true);
  };

  const [isLoggedIn, setIsLoggedIn] = useState(false);

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 border border-slate-100">
          <div className="flex justify-center mb-6">
            <div className="h-16 w-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg"><Calculator size={32} /></div>
          </div>
          <h2 className="text-2xl font-bold text-center text-slate-900 mb-2">Monitoria Matemática</h2>
          <p className="text-center text-slate-500 mb-8 italic">Dica: Use "monitor" no e-mail para entrar como ADM</p>
          <form onSubmit={handleLogin} className="space-y-4">
            <input type="text" className="w-full px-4 py-3 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500" placeholder="Seu e-mail" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <input type="password" title="senha" className="w-full px-4 py-3 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500" placeholder="Sua senha" required />
            <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 shadow-lg">Acessar Sistema</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans">
      {/* NAVBAR */}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => {setCurrentView('dashboard'); setIsSimulating(false)}}>
            <div className="bg-[#1E1E1E] p-2 rounded-lg text-white"><Calculator size={20} /></div>
            <div>
              <h1 className="font-bold text-slate-900 leading-none text-sm md:text-base">Monitoria Matemática</h1>
              <span className="text-[10px] font-bold text-slate-400 uppercase">3º ANO C</span>
            </div>
          </div>

          <div className="hidden md:flex bg-slate-100 p-1 rounded-xl">
            <button onClick={() => {setCurrentView('dashboard'); setIsSimulating(false)}} className={`px-4 py-1.5 rounded-lg text-sm font-medium ${currentView === 'dashboard' ? 'bg-white shadow-sm' : 'text-slate-500'}`}>Início</button>
            {user?.role === 'monitor' && (
              <button onClick={() => setCurrentView('monitor')} className={`px-4 py-1.5 rounded-lg text-sm font-medium ${currentView === 'monitor' ? 'bg-white shadow-sm' : 'text-slate-500'}`}>Painel do Monitor</button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold">{user?.name}</p>
              <p className="text-[10px] text-slate-400 uppercase">{user?.role === 'monitor' ? 'Monitor' : 'Estudante'}</p>
            </div>
            <button onClick={() => setIsLoggedIn(false)} className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-full"><LogOut size={18} /></button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 md:p-8">
        {isSimulating ? (
          <div className="bg-white rounded-[2rem] p-8 border text-center shadow-sm max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold mb-4">Simulado Iniciado! 📝</h2>
            <p className="text-slate-500 mb-6">Assunto: <span className="font-bold text-blue-600">{selectedTopic}</span> | Questões: <span className="font-bold text-blue-600">{selectedQty}</span></p>
            <div className="h-4 bg-slate-100 rounded-full mb-8 overflow-hidden"><div className="h-full bg-blue-600 w-1/12 animate-pulse"></div></div>
            <button onClick={() => setIsSimulating(false)} className="bg-slate-900 text-white px-8 py-3 rounded-xl font-bold">Finalizar e Ver Resultado</button>
          </div>
        ) : currentView === 'dashboard' ? (
          <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-gradient-to-br from-[#3B429F] to-[#6A72D1] rounded-[2rem] p-8 text-white relative overflow-hidden shadow-xl">
                <h2 className="text-3xl font-bold mb-2">Olá, {user?.name}! 👋</h2>
                <p className="opacity-80 mb-8 font-medium">Pronto para a monitoria de hoje?</p>
                <div className="flex gap-8 mb-8">
                  <div><p className="text-[10px] uppercase font-bold opacity-60">Simulados Feitos</p><p className="text-2xl font-bold">{user?.role === 'monitor' ? '12' : '0'}</p></div>
                  <div><p className="text-[10px] uppercase font-bold opacity-60">Precisão Geral</p><p className="text-2xl font-bold">{user?.role === 'monitor' ? '85%' : '0%'}</p></div>
                </div>
                <button onClick={() => setIsSimulating(true)} className="bg-white text-slate-900 px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:scale-105 transition-all shadow-lg"><Play size={18} fill="currentColor" /> Começar Novo Simulado</button>
              </div>

              <div className="bg-white rounded-[2rem] p-6 border shadow-sm flex flex-col justify-between">
                <h3 className="font-bold text-slate-800 flex items-center gap-2"><Trophy size={18} className="text-yellow-500" /> Último Desempenho</h3>
                <div className="bg-slate-50 p-6 rounded-2xl border border-dashed text-center">
                  <p className="text-3xl font-black text-slate-700">{user?.role === 'monitor' ? '9/10' : '0/0'}</p>
                  <p className="text-xs text-slate-400 font-bold uppercase mt-2">Aguardando seu primeiro teste</p>
                </div>
                <p className="text-[10px] text-slate-400 font-medium text-center mt-4 italic">Dados atualizados em tempo real</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-[2rem] p-8 border shadow-sm">
                <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-6"><Calculator size={20} className="text-blue-500" /> Configurar Simulado</h3>
                <div className="space-y-6">
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase mb-3">Quantidade de Questões</p>
                    <div className="flex gap-2">
                      {[5, 10, 15, 20].map(n => (
                        <button key={n} onClick={() => setSelectedQty(n)} className={`flex-1 py-2 rounded-lg font-bold border transition-all ${selectedQty === n ? 'bg-[#1E1E1E] text-white border-[#1E1E1E]' : 'bg-white text-slate-400 hover:border-slate-300'}`}>{n}</button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase mb-3">Assunto (Opcional)</p>
                    <div className="flex flex-wrap gap-2">
                      {['Todos', 'Probabilidade', 'Logaritmos', 'Estatística', 'Geometria'].map(t => (
                        <button key={t} onClick={() => setSelectedTopic(t)} className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-all ${selectedTopic === t ? 'bg-[#1E1E1E] text-white' : 'bg-white text-slate-400 hover:border-slate-300'}`}>{t}</button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-[2rem] p-8 border shadow-sm">
                <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-6"><AlertCircle size={20} className="text-orange-500" /> Avisos da Monitoria</h3>
                <div className="space-y-3">
                  <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 flex items-center justify-between">
                    <span className="text-sm font-medium text-blue-800 underline">Material de Logaritmos.pdf</span>
                    <ChevronRight size={16} className="text-blue-400" />
                  </div>
                  <div className="p-4 bg-orange-50 rounded-2xl border border-orange-100 flex items-center justify-between">
                    <span className="text-sm font-medium text-orange-800">Aula extra na terça-feira</span>
                    <span className="text-[10px] font-bold text-orange-400 uppercase">Novo!</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Gestão da Turma (Monitor)</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-6 rounded-2xl border shadow-sm">
                <p className="text-slate-400 text-xs font-bold uppercase">Alunos Ativos</p>
                <p className="text-3xl font-bold">34</p>
              </div>
              <div className="bg-white p-6 rounded-2xl border shadow-sm text-green-600">
                <p className="text-slate-400 text-xs font-bold uppercase">Média Geral</p>
                <p className="text-3xl font-bold">7.8</p>
              </div>
              <div className="bg-white p-6 rounded-2xl border shadow-sm text-blue-600">
                <p className="text-slate-400 text-xs font-bold uppercase">Dúvidas Pendentes</p>
                <p className="text-3xl font-bold">5</p>
              </div>
            </div>
            <div className="bg-white rounded-2xl border p-6">
               <h4 className="font-bold mb-4">Últimas Atividades</h4>
               <div className="divide-y text-sm">
                  <div className="py-3 flex justify-between"><span>Ana Silva finalizou Simulado</span><span className="font-bold">Nota 9.0</span></div>
                  <div className="py-3 flex justify-between"><span>Pedro Santos iniciou Quiz</span><span className="text-slate-400 italic">Em andamento</span></div>
               </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}