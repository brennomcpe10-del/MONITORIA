/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, FormEvent } from 'react';
import { 
  Calculator, 
  LogOut, 
  LayoutDashboard, 
  Users, 
  PlusCircle,
  GraduationCap,
  Play,
  History,
  TrendingUp,
  AlertCircle,
  BarChart3,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Lightbulb,
  Loader2,
  ClipboardList,
  PlusSquare,
  Trash2,
  Trophy,
  Target,
  Timer
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Toaster, toast } from 'sonner';

// Firebase Imports
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  onSnapshot, 
  setDoc, 
  deleteDoc, 
  query, 
  where, 
  getDocs, 
  getDoc,
  orderBy
} from 'firebase/firestore';

// --- Firebase Config ---
const firebaseConfig = {
  apiKey: 'AIzaSyCpVxucRWHOev_glPdkGPlbReGlDMXWkeM',
  authDomain: 'monitoria-241b7.firebaseapp.com',
  projectId: 'monitoria-241b7',
  storageBucket: 'monitoria-241b7.firebasestorage.app',
  messagingSenderId: '103385176949',
  appId: '1:103385176949:web:f217c4adc07d024e7d113c',
  measurementId: 'G-J0R4QS27C4'
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// --- Types & Interfaces ---
type Role = 'student' | 'monitor';

interface UserProfile {
  name: string;
  email: string;
  role: Role;
  approved: boolean;
  lastMissedQuestionIds: string[];
}

interface UserSummary {
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
  imageUrl?: string;
}

interface QuizResult {
  id: string;
  date: string;
  total: number;
  score: number;
  answers: { questionId: string, selectedIndex: number }[];
  topicStats: {
    [topic: string]: {
      total: number;
      errors: number;
    };
  };
  missedQuestionIds: string[];
}

// --- Initial Mock Data ---
const INITIAL_QUESTIONS: Question[] = [
  { id: '1', topic: 'Funções de 1º Grau', text: 'Qual é o valor do coeficiente angular da reta que passa pelos pontos A(1, 2) e B(3, 8)?', options: ['2', '3', '4', '6'], correctIndex: 1, explanation: 'O coeficiente angular (m) é dado por (y2 - y1) / (x2 - x1). Logo, (8 - 2) / (3 - 1) = 6 / 2 = 3.' },
  { id: '2', topic: 'Trigonometria', text: 'Se sen(x) = 1/2 e x está no primeiro quadrante, qual o valor de cos(x)?', options: ['√3/2', '√2/2', '1/2', '0'], correctIndex: 0, explanation: 'Pela relação fundamental: sen²x + cos²x = 1. (1/2)² + cos²x = 1 -> 1/4 + cos²x = 1 -> cos²x = 3/4 -> cosx = √3/2.' },
  { id: '3', topic: 'Probabilidade', text: 'Ao lançar um dado justo de 6 faces, qual a probabilidade de sair um número primo?', options: ['1/6', '1/3', '1/2', '2/3'], correctIndex: 2, explanation: 'Os números primos entre 1 e 6 são 2, 3 e 5. São 3 favoritos num total de 6 possibilidades. 3/6 = 1/2.' },
  { id: '4', topic: 'Geometria Espacial', text: 'Qual o volume de um cilindro com raio da base 2cm e altura 5cm? (Considere π = 3)', options: ['30 cm³', '45 cm³', '60 cm³', '90 cm³'], correctIndex: 2, explanation: 'V = π * r² * h. V = 3 * 2² * 5 = 3 * 4 * 5 = 60 cm³.' },
  { id: '5', topic: 'Estatística', text: 'Em um conjunto de dados {2, 2, 5, 7, 9}, qual é a mediana?', options: ['2', '5', '7', '9'], correctIndex: 1, explanation: 'A mediana é o valor central. Ordenado: 2, 2, 5, 7, 9. O valor central é 5.' },
  { id: '6', topic: 'Logaritmos', text: 'Determine o valor de log₂ (32).', options: ['2', '4', '5', '6'], correctIndex: 2, explanation: 'log₂ (32) = x -> 2^x = 32. Como 32 = 2^5, então x = 5.' },
  { id: '7', topic: 'Progressão Aritmética', text: 'Qual o 10º termo da PA (3, 7, 11, ...)?', options: ['36', '39', '43', '47'], correctIndex: 1, explanation: 'Usando a fórmula do termo geral: an = a1 + (n-1)r. a10 = 3 + (10-1)*4 = 3 + 36 = 39.' },
  { id: '8', topic: 'Geometria Analítica', text: 'A distância entre os pontos (0,0) e (3,4) no plano cartesiano é:', options: ['3', '4', '5', '7'], correctIndex: 2, explanation: 'd = √((x2-x1)² + (y2-y1)²). d = √(3² + 4²) = √(9+16) = √25 = 5.' }
];

// --- Sub-Components (Standard HTML/Tailwind) ---

const Card = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
  <div className={`bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden ${className}`}>
    {children}
  </div>
);

const Badge = ({ children, color = "indigo" }: { children: React.ReactNode, color?: "indigo" | "emerald" | "amber" | "rose" }) => {
  const colors = {
    indigo: "bg-indigo-50 text-indigo-600 border-indigo-100",
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
    amber: "bg-amber-50 text-amber-600 border-amber-100",
    rose: "bg-rose-50 text-rose-600 border-rose-100"
  };
  return (
    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${colors[color]}`}>
      {children}
    </span>
  );
};

// --- Main Application ---

export default function App() {
  // --- Auth State ---
  const [sessionEmail, setSessionEmail] = useState<string | null>(() => {
    return localStorage.getItem('mm_session_email');
  });
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loginData, setLoginData] = useState({ name: '', email: '' });

  // --- App State ---
  const [allUsers, setAllUsers] = useState<UserSummary[]>([]);
  const [currentView, setCurrentView] = useState<'dashboard' | 'quiz' | 'monitor'>('dashboard');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [results, setResults] = useState<QuizResult[]>([]);
  const [quizConfig, setQuizConfig] = useState<{ count: number, topic?: string } | null>(null);

  // 1. Sync Profile in real-time
  useEffect(() => {
    if (!sessionEmail) {
      setProfile(null);
      return;
    }

    const unsub = onSnapshot(doc(db, 'users', sessionEmail), (docSnap) => {
      if (docSnap.exists()) {
        setProfile(docSnap.data() as UserProfile);
      } else {
        // Handle case where user might have been deleted
        setProfile(null);
        setSessionEmail(null);
        localStorage.removeItem('mm_session_email');
      }
    });

    return () => unsub();
  }, [sessionEmail]);

  // 2. Sync Questions in real-time
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'questions'), (snap) => {
      const qData = snap.docs.map(d => ({ ...d.data(), id: d.id } as Question));
      setQuestions(qData);
    });
    return () => unsub();
  }, []);

  // 3. Sync All Users (for Monitor View)
  useEffect(() => {
    if (profile?.role === 'monitor') {
      const unsub = onSnapshot(collection(db, 'users'), (snap) => {
        const uData = snap.docs.map(d => ({ ...d.data() } as UserSummary));
        setAllUsers(uData);
      });
      return () => unsub();
    }
  }, [profile?.role]);

  // 4. Sync Results for the current user
  useEffect(() => {
    if (profile) {
      const q = query(
        collection(db, 'results'), 
        where('userEmail', '==', profile.email),
        orderBy('date', 'desc')
      );
      const unsub = onSnapshot(q, (snap) => {
        const rData = snap.docs.map(d => ({ ...d.data(), id: d.id } as QuizResult));
        setResults(rData);
      });
      return () => unsub();
    } else {
      setResults([]);
    }
  }, [profile?.email]);

  // Logout
  const handleLogout = () => {
    setSessionEmail(null);
    setProfile(null);
    localStorage.removeItem('mm_session_email');
    setCurrentView('dashboard');
  };

  // Login Logic
  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    if (!loginData.name || !loginData.email) return toast.error('Preencha os campos!');
    
    const email = loginData.email.toLowerCase().trim();
    const isAdmin = email === 'brennomcpe10@gmail.com';
    const name = isAdmin ? 'Halysson Brenno' : loginData.name;
    
    try {
      const userRef = doc(db, 'users', email);
      const userSnap = await getDoc(userRef);
      
      if (!userSnap.exists()) {
        const newProfile: UserProfile = {
          name: name,
          email: email,
          role: isAdmin ? 'monitor' : 'student',
          approved: isAdmin ? true : false,
          lastMissedQuestionIds: []
        };
        await setDoc(userRef, newProfile);
        toast.success(newProfile.approved ? 'Bem-vindo!' : 'Cadastro realizado! Aguarde aprovação.');
      } else {
        // If admin logs in, ensure they are always monitor/approved even if data was manually changed
        if (isAdmin) {
          await setDoc(userRef, { role: 'monitor', approved: true }, { merge: true });
        }
        toast.success('Bem-vindo de volta!');
      }

      setSessionEmail(email);
      localStorage.setItem('mm_session_email', email);
    } catch (error) {
      console.error(error);
      toast.error('Erro ao conectar ao Firebase.');
    }
  };

  if (!profile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4 selection:bg-indigo-100">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
          <div className="rounded-[2.5rem] bg-white p-10 shadow-2xl shadow-slate-200 border border-slate-100">
            <div className="flex flex-col items-center mb-10 text-center">
              <div className="w-16 h-16 bg-indigo-600 rounded-3xl flex items-center justify-center text-white mb-6 shadow-xl shadow-indigo-600/30">
                <Calculator className="w-8 h-8" />
              </div>
              <h1 className="text-3xl font-black tracking-tight text-slate-900 leading-none mb-2">Monitoria 3º Ano C</h1>
              <p className="text-slate-400 font-medium">Plataforma de simulados matemáticos</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Seu Nome</label>
                <input 
                  className="w-full h-12 px-5 rounded-2xl bg-slate-50 border border-slate-100 focus:outline-none focus:ring-4 focus:ring-indigo-600/10 focus:border-indigo-600 transition-all font-medium" 
                  value={loginData.name} onChange={e => setLoginData({...loginData, name: e.target.value})} placeholder="Ex: João Silva" 
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">E-mail</label>
                <input 
                  className="w-full h-12 px-5 rounded-2xl bg-slate-50 border border-slate-100 focus:outline-none focus:ring-4 focus:ring-indigo-600/10 focus:border-indigo-600 transition-all font-medium" 
                  value={loginData.email} onChange={e => setLoginData({...loginData, email: e.target.value})} placeholder="jose@escola.com" 
                />
              </div>
              <button 
                type="submit"
                className="w-full h-14 bg-indigo-600 text-white rounded-2xl font-black text-lg shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 active:scale-[0.98] transition-all mt-4"
              >
                Entrar na Plataforma
              </button>
            </form>
            <div className="mt-8 pt-8 border-t border-slate-100 text-center">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300">Apenas Alunos Autorizados</p>
            </div>
          </div>
        </motion.div>
        <Toaster richColors position="top-center" />
      </div>
    );
  }

  if (!profile.approved) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md">
          <Card className="p-10 text-center">
             <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center text-amber-600 mx-auto mb-6 shadow-lg shadow-amber-500/10">
               <AlertCircle className="w-10 h-10" />
             </div>
             <h2 className="text-2xl font-black text-slate-800 mb-2">Acesso Pendente</h2>
             <p className="text-slate-500 font-medium mb-8">Seu cadastro foi realizado, mas ainda não foi aprovado pelo monitor responsável. Volte mais tarde!</p>
             <button onClick={handleLogout} className="w-full h-14 bg-slate-100 text-slate-600 rounded-2xl font-black hover:bg-slate-200 transition-all">Sair do Sistema</button>
             <div className="mt-8 pt-8 border-t border-slate-100">
               <p className="text-[10px] font-black uppercase tracking-widest text-slate-300">Contato: brennomcpe10@gmail.com</p>
             </div>
          </Card>
        </motion.div>
        <Toaster richColors position="top-center" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-indigo-100">
      {/* Navbar */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100 px-6 h-20 flex items-center">
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setCurrentView('dashboard')}>
            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-600/30">
              <Calculator className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tighter">Monitoria <span className="text-indigo-600">3º C</span></h2>
              <p className="text-[10px] font-black uppercase tracking-widest text-indigo-600/50">Matemática Ninja</p>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-2">
            <button 
              onClick={() => setCurrentView('dashboard')}
              className={`px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all ${currentView === 'dashboard' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 px-6' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <LayoutDashboard className="w-4 h-4" /> Início
            </button>
            {profile.role === 'monitor' && (
              <button 
                onClick={() => setCurrentView('monitor')}
                className={`px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all ${currentView === 'monitor' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 px-6' : 'text-slate-400 hover:text-slate-600'}`}
              >
                <Users className="w-4 h-4" /> Monitoria
              </button>
            )}
          </nav>

          <div className="flex items-center gap-4">
            <div className="hidden sm:block text-right pr-4 border-r border-slate-100">
              <p className="text-sm font-black text-slate-800">{profile.name}</p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{profile.role}</p>
            </div>
            <button onClick={handleLogout} className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all border border-slate-200">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentView}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.2 }}
          >
            {currentView === 'dashboard' && (
              <Dashboard results={results} onStart={(c, t) => { setQuizConfig({count:c, topic:t}); setCurrentView('quiz'); }} questions={questions} profile={profile} />
            )}
            {currentView === 'quiz' && quizConfig && (
              <QuizView 
                config={quizConfig} 
                allQuestions={questions} 
                profile={profile}
                onFinish={async (res: QuizResult | null) => { 
                  if (res) {
                    try {
                      // Save result to Firestore
                      const resId = Math.random().toString(36).substring(2, 11);
                      await setDoc(doc(db, 'results', resId), { 
                        ...res, 
                        userEmail: profile.email,
                        userName: profile.name 
                      });
                      
                      // Update user's specific progress
                      await setDoc(doc(db, 'users', profile.email), { 
                        lastMissedQuestionIds: res.missedQuestionIds 
                      }, { merge: true });
                    } catch (e) {
                      console.error(e);
                      toast.error('Erro ao salvar resultado no banco.');
                    }
                  }
                  setCurrentView('dashboard');
                }} 
              />
            )}
            {currentView === 'monitor' && (
              <MonitorView 
                results={results} 
                questions={questions} 
                allUsers={allUsers} 
                isAdmin={profile.email === 'brennomcpe10@gmail.com'}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>
      <Toaster richColors position="top-center" />
    </div>
  );
}

// --- Views ---

function Dashboard({ results, onStart, questions, profile }: any) {
  const [selectedCount, setSelectedCount] = useState(10);
  const [selectedTopic, setSelectedTopic] = useState<string | undefined>(undefined);
  const topics = Array.from(new Set(questions.map((q: any) => q.topic)));
  
  const latestResult = results[0];
  const acc = results.length > 0 
    ? (results.reduce((a: any, b: any) => a + b.score, 0) / results.reduce((a: any, b: any) => a + b.total, 0) * 100).toFixed(0) 
    : 0;

  return (
    <div className="space-y-8">
      <div className="grid gap-6 md:grid-cols-3">
        <div className="relative overflow-hidden bg-indigo-600 rounded-[2.5rem] p-10 text-white shadow-2xl shadow-indigo-600/20 md:col-span-2">
          <div className="absolute right-0 top-0 w-80 h-80 bg-white/10 blur-[100px] rounded-full translate-x-1/3 -translate-y-1/3"></div>
          <div className="relative z-10 flex flex-col h-full">
            <h2 className="text-4xl font-black mb-2 leading-none tracking-tight">Opa, {profile.name}! 👋</h2>
            <p className="text-indigo-100 font-medium mb-10">Mantenha o foco. O aprendizado é degrau por degrau.</p>
            <div className="mt-auto grid grid-cols-2 md:grid-cols-4 gap-4">
              <div><p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-300">Simulados</p><p className="text-3xl font-black">{results.length}</p></div>
              <div><p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-300">Precisão</p><p className="text-3xl font-black text-indigo-100">{acc}%</p></div>
            </div>
          </div>
        </div>

        <Card className="flex flex-col p-8">
          <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2"><Trophy className="w-5 h-5 text-indigo-600" /> Último Desempenho</h3>
          {latestResult ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between p-5 bg-slate-50 rounded-3xl border border-slate-100">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Acertos</p>
                  <p className="text-2xl font-black text-slate-800">{latestResult.score}/{latestResult.total}</p>
                </div>
                <div className="w-14 h-14 rounded-full border-4 border-indigo-100 border-t-indigo-600 flex items-center justify-center font-black text-xs text-indigo-600">
                  {((latestResult.score / latestResult.total) * 100).toFixed(0)}%
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                <Target className="w-3.5 h-3.5" /> Focado em {Object.keys(latestResult.topicStats).length} assunto(s)
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-10">
              <BarChart3 className="w-16 h-16 text-slate-100 mb-4" />
              <p className="text-sm font-bold text-slate-300">Sem histórico ainda.</p>
            </div>
          )}
        </Card>
      </div>

      <div className="grid gap-10 lg:grid-cols-2">
        <div className="space-y-6">
           <div className="flex items-center justify-between">
             <h3 className="text-xl font-bold flex items-center gap-2">Configurar Simulado</h3>
             <Badge color="indigo">Beta v1.0</Badge>
           </div>
           
           <Card className="p-8 space-y-8">
              <div className="space-y-4">
                <label className="text-sm font-black uppercase tracking-widest text-slate-400">Questões</label>
                <div className="grid grid-cols-4 gap-3">
                  {[5, 10, 15, 20].map(c => (
                    <button key={c} onClick={() => setSelectedCount(c)} className={`h-12 rounded-2xl font-black transition-all ${selectedCount === c ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 ring-2 ring-indigo-600 ring-offset-2' : 'bg-slate-50 text-slate-500 hover:bg-slate-100 shadow-sm border border-slate-100'}`}>
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-sm font-black uppercase tracking-widest text-slate-400">Assunto</label>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => setSelectedTopic(undefined)} className={`px-5 py-2 rounded-xl text-xs font-bold transition-all border ${selectedTopic === undefined ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-500 border-slate-100 hover:bg-slate-50'}`}>Todos</button>
                  {topics.map((t:any) => (
                    <button key={t} onClick={() => setSelectedTopic(t)} className={`px-5 py-2 rounded-xl text-xs font-bold transition-all border ${selectedTopic === t ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-500 border-slate-100 hover:bg-slate-50'}`}>{t}</button>
                  ))}
                </div>
              </div>

              <button 
                onClick={() => onStart(selectedCount, selectedTopic)}
                className="w-full h-16 bg-emerald-500 text-white rounded-[1.5rem] font-black text-xl shadow-xl shadow-emerald-500/20 hover:bg-emerald-600 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                <Play className="w-6 h-6 fill-white" /> Iniciar Agora
              </button>
           </Card>
        </div>

        <div className="space-y-6">
           <h3 className="text-xl font-bold flex items-center gap-2">Pontos Fracos</h3>
           <Card className="p-8 flex flex-col h-full bg-slate-900 text-white border-none shadow-indigo-600/10">
              <p className="text-slate-400 text-sm mb-8">Assuntos que você precisa reforçar de acordo com seus erros.</p>
              {results.length > 0 ? (
                <div className="space-y-6 flex-1">
                   {Object.entries(results.reduce((acc, curr) => {
                      Object.entries(curr.topicStats).forEach(([topic, stats]: any) => {
                        if (!acc[topic]) acc[topic] = { total: 0, errors: 0 };
                        acc[topic].total += stats.total; acc[topic].errors += stats.errors;
                      }); return acc;
                    }, {} as any)).sort((a:any, b:any) => (b[1].errors/b[1].total) - (a[1].errors/a[1].total)).slice(0, 4).map(([t, s]: any) => (
                      <div key={t} className="flex items-center justify-between group">
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full bg-rose-500 group-hover:scale-150 transition-all"></div>
                          <span className="font-bold text-slate-200">{t}</span>
                        </div>
                        <span className="text-xs font-black text-rose-500">{((s.errors/s.total)*100).toFixed(0)}% Erro</span>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center text-slate-600 font-bold border-2 border-dashed border-slate-800 rounded-3xl p-10 text-center">
                   Complete simulados para descobrir seus pontos fracos.
                </div>
              )}
           </Card>
        </div>
      </div>
    </div>
  );
}

function QuizView({ config, allQuestions, onFinish, profile }: any) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [idx, setIdx] = useState(0);
  const [ans, setAns] = useState<(number | null)[]>([]);
  const [finished, setFinished] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => {
      const filtered = config.topic ? allQuestions.filter((q: any) => q.topic === config.topic) : allQuestions;
      const final = [...filtered].sort(() => Math.random() - 0.5).slice(0, config.count);
      setQuestions(final);
      setAns(new Array(final.length).fill(null));
      setLoading(false);
    }, 800);
  }, []);

  if (loading) return <div className="flex flex-col items-center justify-center py-40"><Loader2 className="w-12 h-12 animate-spin text-indigo-600 mb-4" /><p className="font-bold text-slate-400">Embaralhando questões...</p></div>;

  if (finished) {
    const score = ans.reduce((acc, v, i) => v === questions[i].correctIndex ? acc + 1 : acc, 0);
    const result: QuizResult = {
      id: Math.random().toString(36),
      date: new Date().toISOString(),
      total: questions.length,
      score,
      answers: questions.map((q, i) => ({ questionId: q.id, selectedIndex: ans[i] as number })),
      topicStats: questions.reduce((acc, q, i) => {
        if (!acc[q.topic]) acc[q.topic] = { total: 0, errors: 0 };
        acc[q.topic].total += 1;
        if (ans[i] !== q.correctIndex) acc[q.topic].errors += 1;
        return acc;
      }, {} as any),
      missedQuestionIds: questions.filter((_, i) => ans[i] !== questions[i].correctIndex).map(q => q.id)
    };

    return (
      <div className="max-w-3xl mx-auto space-y-10">
        <div className="rounded-[2.5rem] bg-white shadow-2xl overflow-hidden text-center border border-slate-100">
           <div className="bg-indigo-600 p-16 text-white relative">
              <CheckCircle2 className="mx-auto w-16 h-16 mb-6 scale-110" />
              <h2 className="text-4xl font-black mb-2 italic">TAMO JUNTO!</h2>
              <p className="text-indigo-200 font-bold uppercase tracking-widest text-xs">Simulado concluído com sucesso</p>
           </div>
           <div className="p-12 relative -mt-10 bg-white rounded-[2rem] mx-8 shadow-xl grid md:grid-cols-2 lg:grid-cols-3 gap-10 items-center">
              <div className="lg:col-span-1 border-r border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Pontuação</p>
                <div className="text-6xl font-black text-indigo-600">{score}/{questions.length}</div>
                <Badge color="indigo">{((score / questions.length) * 100).toFixed(0)}% Acertos</Badge>
              </div>
              <div className="text-left md:col-span-1 lg:col-span-2 space-y-4">
                 <h4 className="font-bold text-slate-500 uppercase text-xs tracking-widest flex items-center gap-2"><Target className="w-4 h-4" /> Desempenho</h4>
                 <div className="space-y-3">
                   {Object.entries(result.topicStats).map(([t, s]: any) => (
                      <div key={t} className="space-y-1">
                        <div className="flex justify-between text-xs font-black">
                          <span className="text-slate-700">{t}</span>
                          <span className="text-slate-400">{(s.total - s.errors)}/{s.total}</span>
                        </div>
                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-indigo-600" style={{ width: `${((s.total - s.errors) / s.total) * 100}%` }}></div>
                        </div>
                      </div>
                   ))}
                 </div>
              </div>
           </div>
           <div className="p-10">
             <button onClick={() => onFinish(result)} className="h-16 w-full lg:w-fit lg:px-20 bg-indigo-600 text-white rounded-2xl font-black text-lg shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 active:scale-95 transition-all">
               Voltar para o Início
             </button>
           </div>
        </div>

        <div className="space-y-6">
          <h3 className="text-2xl font-black text-slate-800 ml-4 italic">CORREÇÃO MONITORADA</h3>
          {questions.map((q, i) => (
            <div key={q.id}>
              <Card className={`p-8 border-l-[10px] ${ans[i] === q.correctIndex ? 'border-l-emerald-500' : 'border-l-rose-500'}`}>
              <div className="flex items-center justify-between mb-6">
                <Badge>{q.topic}</Badge>
                {ans[i] === q.correctIndex 
                  ? <span className="flex items-center gap-1 text-emerald-600 font-bold text-sm"><CheckCircle2 className="w-4 h-4" /> Correto</span>
                  : <span className="flex items-center gap-1 text-rose-600 font-bold text-sm"><XCircle className="w-4 h-4" /> Errou feio</span>
                }
              </div>
              <p className="text-xl font-bold text-slate-800 leading-relaxed mb-8">{q.text}</p>
              <div className="grid gap-2 mb-8">
                {q.options.map((o, oi) => (
                  <div key={oi} className={`p-4 rounded-2xl border text-sm font-bold flex items-center justify-between ${oi === q.correctIndex ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : oi === ans[i] ? 'bg-rose-50 border-rose-200 text-rose-800' : 'bg-slate-50 border-slate-100 opacity-60'}`}>
                    {o} {oi === q.correctIndex && <CheckCircle2 className="w-4 h-4 text-emerald-600" />} {oi === ans[i] && oi !== q.correctIndex && <XCircle className="w-4 h-4 text-rose-600" />}
                  </div>
                ))}
              </div>
              <div className="bg-indigo-50/50 p-6 rounded-3xl border border-indigo-100 italic text-indigo-700">
                 <div className="flex items-center gap-2 font-black text-indigo-800 mb-2 uppercase text-[10px] tracking-widest"><Lightbulb className="w-4 h-4" /> Comentário do Monitor</div>
                 <p className="text-sm leading-relaxed">{q.explanation}</p>
              </div>
            </Card>
          </div>
        ))}
        </div>
      </div>
    );
  }

  const q = questions[idx];
  const isPreviouslyMissed = profile.lastMissedQuestionIds.includes(q.id);

  return (
    <div className="max-w-4xl mx-auto">
       <div className="mb-10 space-y-4">
         <div className="flex items-center justify-between">
           <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black">{idx + 1}</div>
             <p className="font-black text-slate-400 uppercase text-xs tracking-widest">de {questions.length} Questões</p>
           </div>
           <div className="flex items-center gap-4 text-slate-400 font-bold text-xs uppercase tracking-widest">
             <div className="flex items-center gap-2"><Timer className="w-4 h-4" /> 00:00</div>
             <button onClick={() => { if(confirm('Deseja mesmo sair?')) onFinish(null); }} className="hover:text-rose-500">Sair</button>
           </div>
         </div>
         <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
            <motion.div initial={{ width: 0 }} animate={{ width: `${((idx + 1)/questions.length)*100}%` }} className="h-full bg-indigo-600 shadow-[0_0_15px_rgba(79,70,229,0.5)]"></motion.div>
         </div>
       </div>

       <Card className="p-10 md:p-14 relative overflow-hidden">
         <div className="mb-8 flex flex-wrap gap-2">
           <Badge color="indigo">{q.topic}</Badge>
           {isPreviouslyMissed && (
             <span className="flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-200 px-3 py-1 rounded-full text-[10px] font-black uppercase animate-bounce">
               <AlertTriangle className="w-3.5 h-3.5" /> Você errou essa na última!
             </span>
           )}
         </div>
         {q.imageUrl && (
           <div className="mb-8 rounded-3xl overflow-hidden border border-slate-100 shadow-sm flex justify-center bg-slate-50">
             <img src={q.imageUrl} alt="Contexto da questão" className="max-h-[300px] object-contain" />
           </div>
         )}
         <h2 className="text-2xl md:text-3xl font-bold text-slate-800 leading-tight mb-12">{q.text}</h2>
         
         <div className="grid gap-3">
           {q.options.map((o, i) => (
             <button 
                key={i} 
                onClick={() => setAns(p => { const n=[...p]; n[idx]=i; return n; })}
                className={`group flex items-center gap-4 p-5 rounded-2xl border-2 transition-all text-left ${ans[idx] === i ? 'border-indigo-600 bg-indigo-50 shadow-md ring-4 ring-indigo-600/5' : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50'}`}
             >
               <div className={`w-10 h-10 flex-shrink-0 rounded-xl flex items-center justify-center font-black transition-all ${ans[idx] === i ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200'}`}>
                 {String.fromCharCode(65 + i)}
               </div>
               <span className={`font-bold transition-all ${ans[idx] === i ? 'text-indigo-800' : 'text-slate-700'}`}>{o}</span>
             </button>
           ))}
         </div>

         <div className="flex items-center justify-between mt-12 pt-10 border-t border-slate-100">
           <button 
             onClick={() => setIdx(p => Math.max(0, p - 1))}
             disabled={idx === 0}
             className="flex items-center gap-2 font-bold text-slate-400 hover:text-slate-600 disabled:opacity-0 transition-all uppercase text-xs tracking-widest"
           >
             <ArrowLeft className="w-4 h-4" /> Anterior
           </button>
           
           {idx === questions.length - 1 ? (
             <button 
               onClick={() => { if(ans[idx] !== null) setFinished(true); }}
               disabled={ans[idx] === null}
               className="h-14 px-12 bg-indigo-600 text-white rounded-2xl font-black text-lg shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 disabled:opacity-50 transition-all"
             >
               Finalizar Simulado
             </button>
           ) : (
             <button 
               onClick={() => { if(ans[idx] !== null) setIdx(p => p + 1); }}
               disabled={ans[idx] === null}
               className="h-14 px-12 bg-indigo-600 text-white rounded-2xl font-black text-lg shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 disabled:opacity-50 transition-all flex items-center gap-2"
             >
               Próxima Questão <ArrowRight className="w-5 h-5" />
             </button>
           )}
         </div>
       </Card>
    </div>
  );
}

function MonitorView({ results, questions, allUsers, isAdmin }: any) {
  const [activeTab, setActiveTab] = useState<'stats' | 'list' | 'add' | 'users'>('stats');
  const [newQ, setNewQ] = useState({ text: '', topic: '', options: ['', '', '', ''], correctIndex: 0, explanation: '', imageUrl: '' });
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [studentDetailedProfile, setStudentDetailedProfile] = useState<any>(null);

  const handleApprove = async (email: string, role: Role) => {
    try {
      await setDoc(doc(db, 'users', email), { approved: true, role }, { merge: true });
      toast.success(`Usuário aprovado como ${role}!`);
    } catch (e) {
      toast.error('Erro na aprovação.');
    }
  };

  const handleSeedQuestions = async () => {
    if (confirm('Deseja popular o banco de dados com as 8 questões iniciais padrão?')) {
      try {
        const promises = INITIAL_QUESTIONS.map(q => setDoc(doc(db, 'questions', q.id), q));
        await Promise.all(promises);
        toast.success('Banco de dados populado!');
      } catch (e) {
        toast.error('Erro ao popular banco.');
      }
    }
  };

  const handleDecline = async (email: string) => {
    try {
      await deleteDoc(doc(db, 'users', email));
      toast.info('Solicitação removida.');
    } catch (e) {
      toast.error('Erro ao remover.');
    }
  };

  const handleDeleteQuestion = async (id: string) => {
    if (confirm('Excluir esta questão permanentemente?')) {
      try {
        await deleteDoc(doc(db, 'questions', id));
        toast.success('Questão removida.');
      } catch (e) {
        toast.error('Erro ao excluir questão.');
      }
    }
  };

  // 1. Calculate and fetch global heatmap (all results)
  const [allSystemResults, setAllSystemResults] = useState<QuizResult[]>([]);
  useEffect(() => {
    if (isAdmin) {
       const q = collection(db, 'results');
       const unsub = onSnapshot(q, (snap) => {
         setAllSystemResults(snap.docs.map(d => d.data() as QuizResult));
       });
       return () => unsub();
    }
  }, [isAdmin]);

  const questionHeatmap = questions.map((q: any) => {
    const timesAnswered = allSystemResults.filter(r => r.answers?.some((a: any) => a.questionId === q.id)).length;
    const errors = allSystemResults.filter(r => r.missedQuestionIds.includes(q.id)).length;
    return {
      ...q,
      timesAnswered,
      errorRate: timesAnswered > 0 ? (errors / timesAnswered) * 100 : 0
    };
  });

  // 2. Fetch selected student details from Firebase
  useEffect(() => {
    if (!selectedStudent) {
      setStudentDetailedProfile(null);
      return;
    }

    const fetchStudentDetails = async () => {
      const user = allUsers.find((u: any) => u.email === selectedStudent);
      const q = query(
        collection(db, 'results'), 
        where('userEmail', '==', selectedStudent),
        orderBy('date', 'desc')
      );
      const snap = await getDocs(q);
      const userResults = snap.docs.map(d => d.data() as QuizResult);
      
      const missedWithAnswers = userResults.flatMap((r: QuizResult) => {
        return r.missedQuestionIds.map(mqId => {
          const q = questions.find((q: any) => q.id === mqId);
          const ansInfo = r.answers?.find(a => a.questionId === mqId);
          return q ? { 
            ...q, 
            marked: q.options[ansInfo?.selectedIndex || 0],
            date: r.date 
          } : null;
        }).filter(Boolean);
      });

      setStudentDetailedProfile({ user, results: userResults, missedWithAnswers });
    };

    fetchStudentDetails();
  }, [selectedStudent, allUsers, questions]);

  const handleAdd = async (e: FormEvent) => {
    e.preventDefault();
    if (!newQ.text || !newQ.topic || newQ.options.some(o => !o) || !newQ.explanation) return toast.error('Complete todos os campos!');
    
    try {
      const id = Math.random().toString(36).substring(2, 11);
      await setDoc(doc(db, 'questions', id), { ...newQ, id });
      toast.success('Questão cadastrada no banco!');
      setNewQ({ text: '', topic: '', options: ['', '', '', ''], correctIndex: 0, explanation: '', imageUrl: '' });
      setActiveTab('list');
    } catch (e) {
      toast.error('Erro ao cadastrar questão.');
    }
  };

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight leading-none mb-2 underline decoration-indigo-600 decoration-8 underline-offset-4">Painel do Monitor</h2>
          <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest leading-none">Análise de Performance • 3º Ano C</p>
        </div>
        <div className="bg-slate-200/50 p-1.5 rounded-2xl flex gap-1 w-fit">
           {(isAdmin ? ['stats', 'list', 'add', 'users'] : ['stats', 'list', 'add'] as const).map(t => (
             <button key={t} onClick={() => setActiveTab(t as any)} className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all ${activeTab === t ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}>
               {t === 'stats' ? 'Dashboard' : t === 'list' ? 'Banco Dados' : t === 'add' ? 'Cadastrar' : 'Usuários'}
             </button>
           ))}
        </div>
      </div>

      {activeTab === 'users' && isAdmin && (
        <div className="space-y-6">
           <div className="flex items-center justify-between">
             <h3 className="text-xl font-bold flex items-center gap-2">Gestão de Usuários</h3>
             <Badge color="amber">Pendentes: {allUsers.filter((u:any) => !u.approved).length}</Badge>
           </div>
           
           <Card className="border-none shadow-2xl p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                      <th className="px-8 py-6">Nome</th>
                      <th className="px-8 py-6">E-mail</th>
                      <th className="px-8 py-6">Status</th>
                      <th className="px-8 py-6 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {allUsers.map((u: any) => (
                      <tr key={u.email} className="group hover:bg-slate-50/50 transition-colors">
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500 text-xs">
                              {u.name.charAt(0)}
                            </div>
                            <span className="font-bold text-slate-700">{u.name}</span>
                          </div>
                        </td>
                        <td className="px-8 py-6 text-sm text-slate-400 font-medium">{u.email}</td>
                        <td className="px-8 py-6">
                          {u.approved ? (
                            <Badge color={u.role === 'monitor' ? 'indigo' : 'emerald'}>{u.role}</Badge>
                          ) : (
                            <span className="flex items-center gap-1.5 text-amber-500 text-[10px] font-black uppercase tracking-widest">
                              <Loader2 className="w-3 h-3 animate-spin" /> Pendente
                            </span>
                          )}
                        </td>
                        <td className="px-8 py-6 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {u.approved && (
                              <>
                                <button 
                                  onClick={() => setSelectedStudent(u.email)}
                                  className="h-8 px-3 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-black uppercase hover:bg-indigo-100"
                                >
                                  Ver Detalhes
                                </button>
                                {u.email !== 'brennomcpe10@gmail.com' && (
                                  <button 
                                    onClick={() => handleDecline(u.email)}
                                    className="h-8 w-8 bg-slate-50 text-slate-300 rounded-lg flex items-center justify-center hover:text-rose-500 hover:bg-rose-50 opacity-0 group-hover:opacity-100 transition-all"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </>
                            )}
                            {!u.approved && (
                              <>
                                <button 
                                  onClick={() => handleApprove(u.email, 'student')}
                                  className="h-8 px-3 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-black uppercase hover:bg-emerald-100"
                                >
                                  Aprovar Aluno
                                </button>
                                <button 
                                  onClick={() => handleApprove(u.email, 'monitor')}
                                  className="h-8 px-3 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-black uppercase hover:bg-indigo-100"
                                >
                                  Aprovar Monitor
                                </button>
                                <button 
                                  onClick={() => handleDecline(u.email)}
                                  className="h-8 w-8 bg-rose-50 text-rose-500 rounded-lg flex items-center justify-center hover:bg-rose-100"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
           </Card>
        </div>
      )}

      {selectedStudent && studentDetailedProfile && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-[2.5rem] w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-indigo-600 text-white">
               <div className="flex items-center gap-4">
                 <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center font-black">{studentDetailedProfile.user.name.charAt(0)}</div>
                 <div>
                   <h3 className="text-xl font-black">{studentDetailedProfile.user.name}</h3>
                   <p className="text-indigo-100 text-[10px] font-bold uppercase tracking-widest">{studentDetailedProfile.user.email}</p>
                 </div>
               </div>
               <button onClick={() => setSelectedStudent(null)} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all"><XCircle className="w-6 h-6" /></button>
            </div>
            <div className="p-8 overflow-y-auto flex-1 space-y-8">
              <div className="grid grid-cols-3 gap-6">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Simulados</p>
                  <p className="text-2xl font-black text-slate-800">{studentDetailedProfile.results.length}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Média</p>
                  <p className="text-2xl font-black text-indigo-600">
                    {studentDetailedProfile.results.length > 0 
                      ? (studentDetailedProfile.results.reduce((a:any, b:any) => a + b.score, 0) / studentDetailedProfile.results.reduce((a:any, b:any) => a + b.total, 0) * 100).toFixed(0) 
                      : 0}%
                  </p>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Questões Erradas</p>
                  <p className="text-2xl font-black text-rose-500">{studentDetailedProfile.missedWithAnswers.length}</p>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-black text-slate-800 uppercase text-xs tracking-widest">Histórico de Erros Específicos</h4>
                {studentDetailedProfile.missedWithAnswers.length > 0 ? (
                  <div className="grid gap-4">
                    {studentDetailedProfile.missedWithAnswers.map((m: any, i: number) => (
                      <div key={i} className="p-5 rounded-2xl border border-slate-100 bg-slate-50 flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                          <Badge>{m.topic}</Badge>
                          <span className="text-[10px] font-bold text-slate-400">ERROU EM {new Date(m.date).toLocaleDateString('pt-BR')}</span>
                        </div>
                        <p className="text-sm font-bold text-slate-700 leading-relaxed">{m.text}</p>
                        <div className="flex gap-4">
                          <div className="flex-1 p-2 rounded-xl bg-rose-100 border border-rose-200 text-rose-700 text-[10px] font-bold uppercase tracking-tight">MARCOU: {m.marked}</div>
                          <div className="flex-1 p-2 rounded-xl bg-emerald-100 border border-emerald-200 text-emerald-700 text-[10px] font-bold uppercase tracking-tight">CORRETO: {m.options[m.correctIndex]}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center py-10 text-slate-300 font-bold italic">Nenhum erro registrado.</p>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {activeTab === 'stats' && (
        <div className="space-y-8 animate-in fade-in duration-300">
           <div className="grid gap-6 md:grid-cols-3">
             <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-xl flex flex-col items-center justify-center text-center">
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Simulados Totais</p>
               <p className="text-4xl font-black text-indigo-600">{allSystemResults.length}</p>
             </div>
             <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-xl flex flex-col items-center justify-center text-center">
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Banco Questões</p>
               <p className="text-4xl font-black text-emerald-500">{questions.length}</p>
             </div>
             <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-xl flex flex-col items-center justify-center text-center">
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Aproveitamento Global</p>
               <p className="text-4xl font-black text-amber-500">
                 {allSystemResults.length > 0 ? (allSystemResults.reduce((a,b)=>a+b.score,0)/allSystemResults.reduce((a,b)=>a+b.total,0)*100).toFixed(0):0}%
               </p>
             </div>
           </div>

           <Card className="p-8 overflow-hidden">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2"><TrendingUp className="w-5 h-5 text-indigo-600" /> Mapa de Calor de Erros</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                   <thead>
                      <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                        <th className="pb-4">Questão</th>
                        <th className="pb-4">Respostas</th>
                        <th className="pb-4 text-right">Taxa de Erro</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100">
                      {questionHeatmap.sort((a,b)=>b.errorRate - a.errorRate).map((q: any) => (
                        <tr key={q.id}>
                          <td className="py-4 text-sm font-medium text-slate-700 max-w-xs truncate pr-4">{q.text}</td>
                          <td className="py-4 text-sm font-black text-slate-400">{q.timesAnswered}</td>
                          <td className="py-4 text-right">
                             <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black ${q.errorRate >= 50 ? 'bg-rose-500 text-white' : q.errorRate > 0 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-400'}`}>
                               {q.errorRate.toFixed(0)}%
                             </div>
                          </td>
                        </tr>
                      ))}
                   </tbody>
                </table>
              </div>
           </Card>
        </div>
      )}

      {activeTab === 'list' && (
        <Card className="border-none shadow-2xl p-0">
          <div className="overflow-x-auto">
            {questions.length > 0 ? (
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                    <th className="px-8 py-6">Assunto</th>
                    <th className="px-8 py-6">Enunciado / Pergunta</th>
                    <th className="px-8 py-6 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {questions.map((q: any) => (
                    <tr key={q.id} className="group hover:bg-slate-50/50 transition-colors">
                      <td className="px-8 py-6"><Badge color="indigo">{q.topic}</Badge></td>
                      <td className="px-8 py-6 text-sm font-bold text-slate-600 max-w-sm truncate">{q.text}</td>
                      <td className="px-8 py-6 text-right">
                        <button 
                          onClick={() => handleDeleteQuestion(q.id)}
                          className="w-10 h-10 rounded-full flex items-center justify-center text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-all opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-20 text-center space-y-6">
                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-300">
                  <ClipboardList className="w-10 h-10" />
                </div>
                <div className="max-w-xs mx-auto">
                  <h4 className="text-xl font-black text-slate-800 mb-2">Banco Vazio</h4>
                  <p className="text-slate-400 font-medium text-sm mb-6">Nenhuma questão encontrada no sistema. Adicione manualmente ou carregue os padrões.</p>
                  <button 
                    onClick={handleSeedQuestions}
                    className="h-12 px-8 bg-indigo-600 text-white rounded-xl font-black text-sm shadow-lg shadow-indigo-600/20 hover:scale-105 transition-all"
                  >
                    Popular Banco Padrão
                  </button>
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      {activeTab === 'add' && (
        <div className="max-w-3xl mx-auto animate-in zoom-in-95 duration-200">
          <Card className="p-10 md:p-14">
             <h3 className="text-2xl font-black text-slate-800 mb-8 flex items-center gap-2"><PlusSquare className="w-6 h-6 text-indigo-600" /> Cadastrar Questão</h3>
             <form onSubmit={handleAdd} className="space-y-8">
               <div className="grid md:grid-cols-2 gap-6">
                 <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Assunto da Aula</label>
                   <input className="w-full h-14 px-6 rounded-2xl bg-slate-50 border border-slate-100 focus:outline-none focus:ring-4 focus:ring-indigo-600/10 transition-all font-bold placeholder:text-slate-300" placeholder="Ex: Geometria Analítica" value={newQ.topic} onChange={e => setNewQ({...newQ, topic: e.target.value})} />
                 </div>
                 <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">URL da Imagem (Opcional)</label>
                   <input className="w-full h-14 px-6 rounded-2xl bg-slate-50 border border-slate-100 focus:outline-none focus:ring-4 focus:ring-indigo-600/10 transition-all font-bold placeholder:text-slate-300" placeholder="Link direto da imagem..." value={newQ.imageUrl} onChange={e => setNewQ({...newQ, imageUrl: e.target.value})} />
                 </div>
               </div>
               <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Enunciado Completo</label>
                 <textarea rows={3} className="w-full p-6 rounded-2xl bg-slate-50 border border-slate-100 focus:outline-none focus:ring-4 focus:ring-indigo-600/10 transition-all font-bold placeholder:text-slate-300 text-sm" placeholder="O que o aluno deve calcular?" value={newQ.text} onChange={e => setNewQ({...newQ, text: e.target.value})} />
               </div>
               
               <div className="space-y-4">
                 <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Alternativas</label>
                 {newQ.options.map((opt, i) => (
                   <div key={i} className="flex gap-4 items-center group">
                      <div className={`w-12 h-12 flex-shrink-0 rounded-2xl flex items-center justify-center font-black ${newQ.correctIndex === i ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200'}`}>
                        {String.fromCharCode(65 + i)}
                      </div>
                      <input className="flex-1 h-12 px-5 rounded-2xl bg-slate-50 border border-slate-100 focus:outline-none text-sm font-bold" value={opt} onChange={e => { const o=[...newQ.options]; o[i]=e.target.value; setNewQ({...newQ, options:o}); }} placeholder={`Opção ${String.fromCharCode(65 + i)}`} />
                      <input type="radio" name="correct" checked={newQ.correctIndex === i} onChange={() => setNewQ({...newQ, correctIndex: i})} className="w-6 h-6 accent-indigo-600" />
                   </div>
                 ))}
                 <p className="text-[10px] font-bold text-slate-300 italic">Preencha o círculo radioativo na resposta correta</p>
               </div>

               <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Correção Comentada (Dica do Monitor)</label>
                 <textarea rows={3} className="w-full p-6 rounded-2xl bg-slate-50 border border-slate-100 focus:outline-none focus:ring-4 focus:ring-indigo-600/10 transition-all font-bold placeholder:text-slate-300 text-sm italic" placeholder="Explique como resolver este problema..." value={newQ.explanation} onChange={e => setNewQ({...newQ, explanation: e.target.value})} />
               </div>

               <button type="submit" className="w-full h-16 bg-indigo-600 text-white rounded-2xl font-black text-xl shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 active:scale-95 transition-all mt-6">
                 Salvar Questão no Banco
               </button>
             </form>
          </Card>
        </div>
      )}
    </div>
  );
}
