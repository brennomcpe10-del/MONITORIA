import React, { useState, useEffect } from 'react';
import { Calculator, LayoutDashboard, Users, LogOut, Play, Trophy, AlertCircle, Clock, ChevronRight, PlusCircle, BarChart3, BookOpen } from 'lucide-react';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState({ name: '', role: 'student' });
  const [currentView, setCurrentView] = useState('dashboard');
  
  // Estados do Simulado
  const [selectedQty, setSelectedQty] = useState(10);
  const [selectedTopic, setSelectedTopic] = useState('Todos');
  const [isSimulating, setIsSimulating] = useState(false);
  const [timer, setTimer] = useState(0);

  // Efeito do Cronômetro
  useEffect(() => {
    let interval: any;
    if (isSimulating) {
      interval = setInterval(() => setTimer(t => t + 1), 1000);
    } else {
      setTimer(0);
    }
    return () => clearInterval(interval);
  }, [isSimulating]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-[2rem] shadow-2xl p-10 border border-slate-100 text-center">
          <div className="inline-flex bg-[#1E1E1E] p-4 rounded-2xl text-white mb-6"><Calculator size={40} /></div>
          <h2 className="text-3xl font-black text-slate-900 mb-2">Monitoria Matemática</h2>
          <p className="text-slate-500 mb-8">Pratique questões e acompanhe seu desempenho.</p>
          <input 
            type="text" 
            placeholder="Digite seu nome" 
            className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl mb-4 outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            onChange={(e) => setUser({...user, name: e.target.value})}
          />
          <button 
            onClick={() => setIsLoggedIn(true)}
            className="w-full bg-[#1E1E1E] text-white py-4 rounded-2xl font-bold hover:bg-black transition-all flex items-center justify-center gap-3"
          >
            Acesso para Alunos e Monitores
          </button>
          <p className="mt-6 text-[10px] text-slate-400 uppercase font-bold tracking-widest">Exclusivo 3º Ano C</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans">
      {/* HEADER IDÊNTICO AO STUDIO */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-[#1E1E1E] p-2.5 rounded-xl text-white"><Calculator size={24} /></div>
            <div>
              <h1 className="font-black text-lg text-slate-900 tracking-tight">Monitoria Matemática</h1>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-tighter">3º ANO C</span>
            </div>
          </div>

          <nav className="hidden lg:flex bg-slate-100/50 p-1.5 rounded-2xl">
            <button onClick={() => {setCurrentView('dashboard'); setIsSimulating(false)}} className={`px-6 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all ${currentView === 'dashboard' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}>
              <LayoutDashboard size={18} /> Início
            </button>
            <button onClick={() => {setCurrentView('monitor'); setIsSimulating(false)}} className={`px-6 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all ${currentView === 'monitor' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}>
              <Users size={18} /> Painel do Monitor
            </button>
          </nav>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-black text-slate-900">{user.name || 'Halysson Brenno'}</p>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest text-right">Monitor</p>
            </div>
            <button onClick={() => setIsLoggedIn(false)} className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-red-50 text-slate-300 hover:text-red-500 transition-all border border-slate-100"><LogOut size={20} /></button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 lg:p-10">
        {isSimulating ? (
          /* TELA DE QUESTÃO (IMAGEM 15) */
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="flex justify-between items-end border-b pb-4 border-slate-200">
              <div className="bg-slate-100 px-4 py-2 rounded-full text-xs font-bold text-slate-600 tracking-tighter">Questão 1 de {selectedQty}</div>
              <div className="flex gap-6 items-center">
                <div className="text-right">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Tempo Decorrido</p>
                  <p className="font-mono font-bold text-lg">{formatTime(timer)}</p>
                </div>
                <button onClick={() => setIsSimulating(false)} className="text-sm font-bold text-blue-600 hover:underline">Desistir</button>
              </div>
            </div>

            <div className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-slate-100">
              <span className="bg-slate-100 px-3 py-1 rounded-lg text-[10px] font-black text-slate-500 uppercase mb-4 inline-block">Logaritmos</span>
              <h2 className="text-3xl font-bold text-slate-800 mb-10 leading-tight">Determine o valor de log₂ (32).</h2>
              
              <div className="grid gap-4">
                {['2', '4', '5', '6'].map((opt, i) => (
                  <button key={opt} className="group flex items-center gap-6 p-6 rounded-[1.5rem] border-2 border-slate-100 hover:border-blue-500 hover:bg-blue-50/30 transition-all text-left">
                    <span className="w-10 h-10 flex items-center justify-center bg-slate-100 rounded-xl font-bold text-slate-400 group-hover:bg-blue-500 group-hover:text-white transition-all uppercase">{String.fromCharCode(65 + i)}</span>
                    <span className="text-xl font-bold text-slate-700">{opt}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : currentView === 'dashboard' ? (
          /* DASHBOARD (IMAGEM 12) */
          <div className="space-y-10">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 bg-[#4F55B3] rounded-[2.5rem] p-10 text-white relative overflow-hidden shadow-2xl shadow-indigo-200">
                <div className="relative z-10">
                  <h2 className="text-4xl lg:text-5xl font-black mb-3">Olá, {user.name || 'Halysson Brenno'}! 👋</h2>
                  <p className="text-indigo-100 text-lg font-medium mb-10">Pronto para a monitoria de hoje?</p>
                  <div className="flex gap-12 mb-10">
                    <div><p className="text-[11px] uppercase font-black opacity-60 tracking-widest mb-1">Simulados Feitos</p><p className="text-3xl font-black">1</p></div>
                    <div><p className="text-[11px] uppercase font-black opacity-60 tracking-widest mb-1">Precisão Geral</p><p className="text-3xl font-black flex items-center gap-2">0% <span className="text-green-400 text-sm">↗</span></p></div>
                  </div>
                  <button onClick={() => setIsSimulating(true)} className="bg-white text-[#1E1E1E] px-8 py-4 rounded-2xl font-black flex items-center gap-3 hover:scale-105 transition-all shadow-xl active:scale-95">
                    <Play size={20} fill="currentColor" /> Começar Novo Simulado
                  </button>
                </div>
                <Calculator size={300} className="absolute right-[-50px] bottom-[-50px] opacity-10 rotate-12" />
              </div>

              <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center mb-8">
                    <h3 className="font-black text-slate-800 flex items-center gap-2"><Trophy size={20} className="text-yellow-500" /> Último Desempenho</h3>
                    <span className="text-[10px] bg-slate-100 px-2.5 py-1 rounded-lg text-slate-400 font-black uppercase">Preview</span>
                  </div>
                  <div className="flex items-center justify-between bg-slate-50/50 p-8 rounded-3xl border-2 border-dashed border-slate-100">
                    <div>
                      <p className="text-[11px] text-slate-400 font-black uppercase mb-1">Acertos</p>
                      <p className="text-4xl font-black text-slate-700">0/1</p>
                    </div>
                    <div className="w-20 h-20 rounded-full border-[6px] border-slate-100 border-t-blue-500 flex items-center justify-center font-black text-slate-300 text-lg">0%</div>
                  </div>
                </div>
                <p className="text-[11px] text-slate-400 font-bold text-center mt-6">Realizado em 25 de abril</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-sm">
                <h3 className="font-black text-slate-800 flex items-center gap-3 mb-8"><BookOpen size={24} className="text-blue-500" /> Configurar Simulado</h3>
                <div className="space-y-8">
                  <div>
                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4">Quantidade de Questões</p>
                    <div className="flex gap-3">
                      {[5, 10, 15, 20].map(n => (
                        <button key={n} onClick={() => setSelectedQty(n)} className={`flex-1 py-3.5 rounded-xl font-black text-sm border-2 transition-all ${selectedQty === n ? 'bg-[#1E1E1E] text-white border-[#1E1E1E]' : 'bg-white text-slate-400 border-slate-50 hover:border-slate-200'}`}>{n}</button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4">Assunto (Opcional)</p>
                    <div className="flex flex-wrap gap-2">
                      {['Todos', 'Probabilidade', 'Logaritmos', 'Estatística', 'Geometria'].map(t => (
                        <button key={t} onClick={() => setSelectedTopic(t)} className={`px-5 py-2 rounded-full text-xs font-black border-2 transition-all ${selectedTopic === t ? 'bg-[#1E1E1E] text-white border-[#1E1E1E]' : 'bg-white text-slate-400 border-slate-50 hover:border-slate-200'}`}>{t}</button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-sm">
                <h3 className="font-black text-slate-800 flex items-center gap-3 mb-8"><AlertCircle size={24} className="text-orange-500" /> Pontos de Atenção</h3>
                <div className="bg-orange-50/30 p-6 rounded-3xl border border-orange-100 flex items-center justify-between">
                  <span className="bg-orange-100 text-orange-600 px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest">Probabilidade</span>
                  <span className="text-xs font-black text-orange-600">100% de Erro</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* PAINEL MONITOR (IMAGEM 16) */
          <div className="space-y-8 animate-in fade-in duration-500">
            <div>
              <h2 className="text-4xl font-black text-slate-900 mb-2">Painel do Monitor</h2>
              <p className="text-slate-500 font-medium">Gerencie questões e acompanhe o desempenho da turma.</p>
            </div>

            <div className="flex gap-2 bg-slate-100/50 p-1 rounded-2xl w-fit">
              {['Estatísticas', 'Questões', 'Adicionar'].map(tab => (
                <button key={tab} className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 ${tab === 'Estatísticas' ? 'bg-white shadow-sm' : 'text-slate-400'}`}>
                  {tab === 'Estatísticas' && <BarChart3 size={16}/>} {tab}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[ {label: 'Total de Simulados', val: '1'}, {label: 'Questões no Banco', val: '7'}, {label: 'Média de Acertos', val: '0.0%'} ].map(stat => (
                <div key={stat.label} className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
                  <p className="text-[11px] text-slate-400 font-black uppercase tracking-widest mb-2">{stat.label}</p>
                  <p className="text-4xl font-black text-slate-800">{stat.val}</p>
                </div>
              ))}
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
              <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-8">
                <h4 className="font-black text-slate-800 mb-6">Erros por Assunto</h4>
                <div className="flex justify-between items-center pb-4 border-b border-slate-50 mb-4">
                  <span className="text-[10px] font-black text-slate-400 uppercase">Assunto</span>
                  <span className="text-[10px] font-black text-slate-400 uppercase">Taxa de Erro</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-700">Probabilidade</span>
                  <span className="bg-red-50 text-red-500 px-3 py-1 rounded-lg text-[10px] font-black">100%</span>
                </div>
              </div>

              <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-8">
                <h4 className="font-black text-slate-800 mb-6">Questões Críticas</h4>
                <div className="space-y-4">
                  <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase border-b pb-2">
                    <span>Enunciado</span>
                    <span>Erros</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-medium text-slate-600 truncate mr-4">Ao lançar um dado justo de 6 faces...</span>
                    <span className="font-black text-red-500">1</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-medium text-slate-600">Determine o valor de log₂ (32).</span>
                    <span className="font-black text-slate-400">0</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}