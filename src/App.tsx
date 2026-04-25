import React, { useState, useEffect, FormEvent } from 'react';
import { 
  Calculator, LogOut, LayoutDashboard, Users, Play, History, 
  AlertCircle, BarChart3, CheckCircle2, XCircle, AlertTriangle, 
  Lightbulb, Loader2, Trophy, Timer, ChevronRight, Clock, UserCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- Interfaces ---
type Role = 'student' | 'monitor';

interface UserProfile {
  name: string;
  email: string;
  role: Role;
  approved: boolean;
}

interface Question {
  id: string;
  text: string;
  topic: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

interface QuizResult {
  id: string;
  date: string;
  total: number;
  score: number;
  timeSeconds: number;
  topicStats: { [topic: string]: { total: number; errors: number; } };
}

// --- Dados Iniciais ---
const ADMIN_EMAIL = 'brennomcpe10@gmail.com';

const INITIAL_QUESTIONS: Question[] = [
  { id: '1', topic: 'Logaritmos', text: 'Determine o valor de log₂ (32).', options: ['2', '4', '5', '6'], correctIndex: 2, explanation: '2^5 = 32, logo o logaritmo é 5.' },
  { id: '2', topic: 'Probabilidade', text: 'Probabilidade de sair um número par em um dado de 6 faces?', options: ['1/6', '1/2', '1/3', '2/3'], correctIndex: 1, explanation: 'Os pares são 2, 4, 6 (3 números). 3/6 = 1/2.' }
];

// --- Componentes de Apoio ---
const Badge = ({ children, color = "indigo" }: any) => {
  const colors: any = {
    indigo: "bg-indigo-50 text-indigo-600 border-indigo-100",
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
    rose: "bg-rose-50 text-rose-600 border-rose-100",
    amber: "bg-amber-50 text-amber-500 border-amber-100"
  };
  return <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border ${colors[color]}`}>{children}</span>;
};

export default function App() {
  const [allUsers, setAllUsers] = useState<UserProfile[]>(() => JSON.parse(localStorage.getItem('mm_users') || '[]'));
  const [profile, setProfile] = useState<UserProfile | null>(() => JSON.parse(localStorage.getItem('mm_session') || 'null'));
  const [loginData, setLoginData] = useState({ name: '', email: '' });
  const [currentView, setCurrentView] = useState<'dashboard' | 'quiz' | 'monitor'>('dashboard');
  const [results, setResults] = useState<QuizResult[]>([]);
  const [quizConfig, setQuizConfig] = useState<any>(null);

  useEffect(() => {
    localStorage.setItem('mm_users', JSON.stringify(allUsers));
    localStorage.setItem('mm_session', JSON.stringify(profile));
    if (profile) {
      const saved = localStorage.getItem(`mm_res_${profile.email}`);
      setResults(saved ? JSON.parse(saved) : []);
    }
  }, [allUsers, profile]);

  const handleLogin = (e: FormEvent) => {
    e.preventDefault();
    const isMaster = loginData.email.toLowerCase() === ADMIN_EMAIL;
    
    let user = allUsers.find(u => u.email === loginData.email);
    
    if (!user) {
      user = {
        name: isMaster ? 'Halysson Brenno' : loginData.name,
        email: loginData.email,
        role: isMaster ? 'monitor' : 'student',
        approved: isMaster
      };
      setAllUsers([...allUsers, user]);
    }
    setProfile(user);
  };

  const approveUser = (email: string) => {
    const updated = allUsers.map(u => u.email === email ? { ...u, approved: true } : u);
    setAllUsers(updated);
  };

  if (!profile) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
        <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl w-full max-w-md border border-slate-100 text-center">
          <div className="bg-indigo-600 w-16 h-16 rounded-2xl flex items-center justify-center text-white mx-auto mb-6"><Calculator size={32}/></div>
          <h1 className="text-3xl font-black mb-2">Monitoria 3º C</h1>
          <form onSubmit={handleLogin} className="space-y-4 mt-8">
            <input className="w-full p-4 bg-slate-50 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-600 font-bold" placeholder="Seu Nome" onChange={e => setLoginData({...loginData, name: e.target.value})} required />
            <input className="w-full p-4 bg-slate-50 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-600 font-bold" type="email" placeholder="Seu E-mail" onChange={e => setLoginData({...loginData, email: e.target.value})} required />
            <button className="w-full bg-indigo-600 text-white p-4 rounded-2xl font-black shadow-lg hover:bg-indigo-700 transition-all">Entrar</button>
          </form>
        </div>
      </div>
    );
  }

  if (!profile.approved) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-10 rounded-[2.5rem] shadow-xl max-w-md text-center">
          <Clock className="mx-auto text-amber-500 mb-6 animate-pulse" size={48} />
          <h2 className="text-2xl font-black mb-4">Acesso Pendente</h2>
          <p className="text-slate-500 mb-8">Halysson Brenno precisa aprovar seu cadastro.</p>
          <button onClick={() => setProfile(null)} className="text-rose-500 font-black uppercase text-xs">Sair</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <header className="bg-white border-b border-slate-100 h-20 px-6 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setCurrentView('dashboard')}>
          <div className="bg-indigo-600 p-2 rounded-xl text-white"><Calculator size={20}/></div>
          <span className="font-black text-lg">Monitoria <span className="text-indigo-600">3º C</span></span>
        </div>
        <nav className="hidden md:flex bg-slate-100 p-1 rounded-2xl">
          <button onClick={() => setCurrentView('dashboard')} className={`px-6 py-2 rounded-xl text-xs font-black uppercase ${currentView === 'dashboard' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400'}`}>Início</button>
          {profile.role === 'monitor' && (
            <button onClick={() => setCurrentView('monitor')} className={`px-6 py-2 rounded-xl text-xs font-black uppercase ${currentView === 'monitor' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400'}`}>Painel Monitor</button>
          )}
        </nav>
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-black">{profile.name}</p>
            <Badge color={profile.role === 'monitor' ? 'emerald' : 'indigo'}>{profile.role}</Badge>
          </div>
          <button onClick={() => setProfile(null)} className="p-2 hover:bg-rose-50 text-slate-300 hover:text-rose-500 rounded-xl transition-all"><LogOut size={20}/></button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 md:p-10">
        {currentView === 'dashboard' && (
          <div className="space-y-8">
            <div className="bg-indigo-600 rounded-[2.5rem] p-10 text-white shadow-2xl flex flex-col md:flex-row justify-between items-center gap-8">
              <div>
                <h2 className="text-4xl font-black mb-4 tracking-tighter text-center md:text-left">Olá, {profile.name}! 👋</h2>
                <p className="opacity-80 font-medium mb-8 text-center md:text-left">Seu progresso é individual e está salvo localmente.</p>
                <div className="flex gap-8 justify-center md:justify-start">
                  <div><p className="text-[10px] font-black uppercase opacity-60">Simulados</p><p className="text-3xl font-black">{results.length}</p></div>
                  <div><p className="text-[10px] font-black uppercase opacity-60">Acertos</p><p className="text-3xl font-black">{results.length > 0 ? results[0].score : 0}</p></div>
                </div>
              </div>
              <button onClick={() => setCurrentView('quiz')} className="bg-white text-indigo-600 px-10 py-5 rounded-2xl font-black shadow-xl hover:scale-105 transition-all">Começar Simulado</button>
            </div>
          </div>
        )}

        {currentView === 'monitor' && (
          <div className="space-y-8">
            <h2 className="text-3xl font-black tracking-tighter">Gestão de Alunos</h2>
            <div className="grid gap-4">
              {allUsers.filter(u => !u.approved).map(u => (
                <div key={u.email} className="bg-white p-6 rounded-3xl border border-slate-100 flex items-center justify-between shadow-sm">
                  <div>
                    <p className="font-black text-slate-800">{u.name}</p>
                    <p className="text-xs text-slate-400 font-bold">{u.email}</p>
                  </div>
                  <button onClick={() => approveUser(u.email)} className="bg-emerald-500 text-white px-6 py-2 rounded-xl font-black text-xs uppercase flex items-center gap-2 hover:bg-emerald-600">
                    <UserCheck size={16}/> Aprovar Aluno
                  </button>
                </div>
              ))}
              {allUsers.filter(u => !u.approved).length === 0 && <p className="text-slate-400 font-medium italic">Nenhum aluno aguardando aprovação.</p>}
            </div>
          </div>
        )}
        
        {currentView === 'quiz' && (
          <div className="max-w-2xl mx-auto bg-white p-10 rounded-[2.5rem] shadow-xl text-center border border-slate-100">
            <h2 className="text-2xl font-black mb-6 italic text-indigo-600">SIMULADO ATIVO</h2>
            <p className="text-slate-500 mb-10">Determine o valor de log₂ (32).</p>
            <div className="grid gap-3">
              {['2', '4', '5', '6'].map((opt, i) => (
                <button key={i} onClick={() => {
                  const res: QuizResult = { id: '1', date: '', total: 1, score: i === 2 ? 1 : 0, timeSeconds: 10, topicStats: {} };
                  setResults([res, ...results]);
                  localStorage.setItem(`mm_res_${profile.email}`, JSON.stringify([res, ...results]));
                  setCurrentView('dashboard');
                }} className="w-full p-4 rounded-xl border-2 border-slate-50 hover:border-indigo-600 font-bold transition-all">{opt}</button>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}