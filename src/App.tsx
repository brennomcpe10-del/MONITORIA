import React, { useState, useEffect } from 'react';
import { Calculator, LayoutDashboard, Users, LogOut, Play, Trophy, AlertCircle, Clock, BookOpen, BarChart3, ChevronRight } from 'lucide-react';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState({ name: '', email: '', role: 'student' });
  const [currentView, setCurrentView] = useState('dashboard');
  
  // Estado de progresso específico do usuário logado
  const [userStats, setUserStats] = useState({ testsDone: 0, accuracy: 0, lastScore: '0/0' });

  // Estados do Simulado
  const [selectedQty, setSelectedQty] = useState(10);
  const [selectedTopic, setSelectedTopic] = useState('Todos');
  const [isSimulating, setIsSimulating] = useState(false);
  const [timer, setTimer] = useState(0);

  // Carregar dados específicos do usuário ao logar
  useEffect(() => {
    if (isLoggedIn && user.email) {
      const savedData = localStorage.getItem(`stats_${user.email}`);
      if (savedData) {
        setUserStats(JSON.parse(savedData));
      } else {
        // Se for um usuário novo, começa do zero
        setUserStats({ testsDone: 0, accuracy: 0, lastScore: '0/0' });
      }
    }
  }, [isLoggedIn, user.email]);

  // Salvar dados quando houver mudança
  const saveProgress = (newStats: any) => {
    setUserStats(newStats);
    localStorage.setItem(`stats_${user.email}`, JSON.stringify(newStats));
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const role = user.email.toLowerCase().includes('monitor') ? 'monitor' : 'student';
    setUser(prev => ({ ...prev, role }));
    setIsLoggedIn(true);
  };

  const finishTest = () => {
    const newStats = {
      testsDone: userStats.testsDone + 1,
      accuracy: 80, // Exemplo de cálculo
      lastScore: `8/${selectedQty}`
    };
    saveProgress(newStats);
    setIsSimulating(false);
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4 font-sans">
        <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-2xl p-10 text-center border border-slate-100">
          <div className="inline-flex bg-blue-600 p-4 rounded-2xl text-white mb-6 shadow-lg shadow-blue-100"><Calculator size={40} /></div>
          <h2 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">Monitoria 3º Ano C</h2>
          <p className="text-slate-500 mb-8 font-medium">Entre para salvar seu progresso individual.</p>
          <form onSubmit={handleLogin} className="space-y-4">
            <input 
              type="text" placeholder="Seu Nome" required
              className="w-full px-6 py-4 bg-slate-50 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 transition-all font-bold"
              onChange={(e) => setUser({...user, name: e.target.value})}
            />
            <input 
              type="email" placeholder="Seu E-mail (use 'monitor' para ADM)" required
              className="w-full px-6 py-4 bg-slate-50 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 transition-all font-bold"
              onChange={(e) => setUser({...user, email: e.target.value})}
            />
            <button type="submit" className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black hover:bg-blue-700 transition-all shadow-lg active:scale-95">Entrar na Plataforma</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans">
      <header className="bg-white border-b border-slate-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => {setCurrentView('dashboard'); setIsSimulating(false)}}>
            <div className="bg-blue-600 p-2 rounded-xl text-white"><Calculator size={24} /></div>
            <h1 className="font-black text-lg hidden md:block">Monitoria Ninja</h1>
          </div>

          <nav className="flex bg-slate-100 p-1.5 rounded-2xl">
            <button onClick={() => setCurrentView('dashboard')} className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${currentView === 'dashboard' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400'}`}>Início</button>
            {user.role === 'monitor' && (
              <button onClick={() => setCurrentView('monitor')} className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${currentView === 'monitor' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400'}`}>Painel Monitor</button>
            )}
          </nav>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-black">{user.name}</p>
              <p className="text-[10px] text-blue-500 font-bold uppercase tracking-widest">{user.role}</p>
            </div>
            <button onClick={() => setIsLoggedIn(false)} className="p-2.5 rounded-xl hover:bg-red-50 text-slate-300 hover:text-red-500 transition-all"><LogOut size={20} /></button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 lg:p-10">
        {isSimulating ? (
          <div className="max-w-3xl mx-auto bg-white rounded-[2.5rem] p-10 shadow-sm border border-slate-100 text-center">
            <h2 className="text-2xl font-black mb-6">Simulado em Andamento... 📝</h2>
            <p className="text-slate-500 mb-8 italic">Você escolheu {selectedQty} questões de {selectedTopic}.</p>
            <button onClick={finishTest} className="bg-blue-600 text-white px-10 py-4 rounded-2xl font-black shadow-lg">Finalizar e Salvar Meu Progresso</button>
          </div>
        ) : currentView === 'dashboard' ? (
          <div className="space-y-10">
            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 bg-blue-600 rounded-[2.5rem] p-10 text-white shadow-2xl shadow-blue-200">
                <h2 className="text-4xl font-black mb-2">Opa, {user.name}! 👋</h2>
                <p className="opacity-80 font-bold mb-10">Seu progresso é único e está salvo no seu e-mail.</p>
                <div className="flex gap-12 mb-10">
                  <div><p className="text-[10px] uppercase font-black opacity-60 mb-1">Simulados</p><p className="text-3xl font-black">{userStats.testsDone}</p></div>
                  <div><p className="text-[10px] uppercase font-black opacity-60 mb-1">Precisão</p><p className="text-3xl font-black">{userStats.accuracy}%</p></div>
                </div>
                <button onClick={() => setIsSimulating(true)} className="bg-white text-blue-600 px-8 py-4 rounded-2xl font-black shadow-xl hover:scale-105 transition-all">Começar Agora</button>
              </div>
              <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 flex flex-col justify-center text-center">
                <Trophy className="mx-auto text-yellow-500 mb-4" size={48} />
                <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Último Resultado</p>
                <p className="text-5xl font-black text-slate-800">{userStats.lastScore}</p>
              </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
              <div className="bg-white rounded-[2.5rem] p-10 border border-slate-100">
                <h3 className="font-black text-lg mb-8 flex items-center gap-2"><BookOpen className="text-blue-600"/> Configurar Simulado</h3>
                <div className="space-y-8">
                  <div>
                    <p className="text-[11px] font-black text-slate-400 uppercase mb-4 tracking-widest">Quantidade</p>
                    <div className="flex gap-2">
                      {[5, 10, 15, 20].map(n => (
                        <button key={n} onClick={() => setSelectedQty(n)} className={`flex-1 py-3 rounded-xl font-black transition-all ${selectedQty === n ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}>{n}</button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-[11px] font-black text-slate-400 uppercase mb-4 tracking-widest">Assuntos</p>
                    <div className="flex flex-wrap gap-2">
                      {['Todos', 'Logaritmos', 'Funções', 'Geometria'].map(t => (
                        <button key={t} onClick={() => setSelectedTopic(t)} className={`px-5 py-2 rounded-full text-xs font-black transition-all ${selectedTopic === t ? 'bg-blue-600 text-white' : 'bg-slate-50 text-slate-400'}`}>{t}</button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-[2.5rem] p-10 border border-slate-100 flex flex-col justify-center">
                 <div className="flex items-center gap-4 text-orange-500 mb-4"><AlertCircle size={32}/><h4 className="font-black">Atenção!</h4></div>
                 <p className="text-slate-500 font-medium leading-relaxed">Seus dados são salvos localmente. Se trocar de navegador, o progresso recomeça.</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-3xl font-black mb-8">Painel do Monitor 📊</h2>
            <div className="grid md:grid-cols-3 gap-6 mb-10">
              <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm"><p className="text-xs font-black text-slate-400 uppercase mb-2">Alunos Ativos</p><p className="text-4xl font-black text-blue-600">42</p></div>
              <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm"><p className="text-xs font-black text-slate-400 uppercase mb-2">Média Geral</p><p className="text-4xl font-black text-slate-800">7.4</p></div>
              <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm"><p className="text-xs font-black text-slate-400 uppercase mb-2">Dúvidas</p><p className="text-4xl font-black text-orange-500">12</p></div>
            </div>
            <div className="bg-white rounded-[2rem] border border-slate-100 p-8">
              <h4 className="font-black mb-6">Atividade Recente</h4>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl"><span className="font-bold">Halysson finalizou Logaritmos</span><span className="text-blue-600 font-black">9/10</span></div>
                <div className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl"><span className="font-bold">João iniciou Simulado</span><span className="text-slate-400 italic">Em curso</span></div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}